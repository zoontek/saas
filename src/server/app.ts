process.env.TZ = "UTC";

import compress from "@fastify/compress";
import middie from "@fastify/middie";
import fstatic from "@fastify/static";
import { createRsbuild, loadConfig } from "@rsbuild/core";
import closeWithGrace, { CloseWithGraceCallback } from "close-with-grace";
import fastify from "fastify";
import fs from "node:fs/promises";
import { IncomingMessage } from "node:http";
import path from "node:path";
import type { ServerApi } from "../client/root.server";

const isProduction = process.env.NODE_ENV === "production"; // use valienv
const port = process.env.PORT || 3000; // use valienv

const transformHtml = (template: string, serverApi: ServerApi) =>
  template
    //.replace(`<!--app-head-->`, rendered.head ?? "") // Add head support somehow
    .replace("<!--app-html-->", serverApi.render());

const startApp = async () => {
  const app = fastify({ logger: true });
  await app.register(middie);

  const onClose = ({ err, signal }: Parameters<CloseWithGraceCallback>[0]) => {
    if (err != null) {
      app.log.error(err, "Server closing with error");
    } else {
      app.log.info(`Server closing on ${signal} signal`);
    }
  };

  if (isProduction) {
    await app.register(compress);

    await app.register(fstatic, {
      root: path.resolve(__dirname, "../static"),
      prefix: "/static/",
      // constraints: { host: "example.com" },
    });
  }

  // TODO: put the business logic here

  if (isProduction) {
    const [template, serverApi] = await Promise.all([
      fs.readFile(path.resolve(__dirname, "../index.html"), "utf-8"),
      // @ts-expect-error this file only exists in dist/ directory
      import("./index").then(
        (module) => module as { default: Record<string, never> } & ServerApi,
      ),
    ]);

    app.get("*", async (_request, reply) => {
      try {
        reply.type("text/html");
        return transformHtml(template, serverApi);
      } catch (error) {
        // TODO: use fastify logger -> use sensible and return a server error if it crashes?
        console.error("SSR render error\n", error);
      }
    });

    const closeListeners = closeWithGrace({ delay: 500 }, async (options) => {
      onClose(options);
      await app.close();
    });

    app.addHook("onClose", () => {
      closeListeners.uninstall();
    });

    await app.listen({ port: 3000 });
  } else {
    const rsbuild = await createRsbuild({
      rsbuildConfig: (await loadConfig({})).content,
    });

    const devServer = await rsbuild.createDevServer({
      getPortSilently: true,
    });

    const { client, server } = devServer.environments;

    if (client == null || server == null) {
      throw new Error("Rsbuild environments are named `client` and `server`");
    }

    app.use((request: IncomingMessage, reply, next) => {
      const url = new URL(`https://example.org${request.url ?? ""}`);
      const hasExtension = path.extname(url.pathname) !== "";

      return hasExtension
        ? devServer.middlewares(request, reply, next)
        : next();
    });

    app.get("*", async (_request, reply) => {
      try {
        const [template, serverApi] = await Promise.all([
          client.getTransformedHtml("index"),
          server.loadBundle<ServerApi>("index"),
        ]);

        reply.type("text/html");
        return transformHtml(template, serverApi);
      } catch (error) {
        // TODO: use fastify logger -> use sensible and return a server error if it crashes?
        console.error("SSR render error\n", error);
      }
    });

    const closeListeners = closeWithGrace({ delay: 500 }, async (options) => {
      onClose(options);
      await devServer.close();
      await app.close();
    });

    app.addHook("onClose", () => {
      closeListeners.uninstall();
    });

    await app.listen({ port: devServer.port });
    await devServer.afterListen();
    devServer.connectWebSocket({ server: app.server });
  }
};

startApp();
