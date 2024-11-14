import { GriffelCSSExtractionPlugin } from "@griffel/webpack-extraction-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig(({ env }) => ({
  plugins: [pluginReact()],

  html: {
    template: "./index.html",
  },

  environments: {
    client: {
      output: {
        target: "web",
      },
      source: {
        entry: {
          index: "./src/index.client.tsx",
        },
      },
    },
    server: {
      output: {
        target: "node",
        distPath: {
          root: "dist/server",
        },
      },
      source: {
        entry: {
          index: "./src/index.server.tsx",
        },
      },
    },
  },

  ...(env === "production" && {
    performance: {
      chunkSplit: {
        strategy: "single-vendor",
      },
    },
    tools: {
      rspack: {
        plugins: [new GriffelCSSExtractionPlugin()],

        optimization: {
          splitChunks: {
            chunks: "async",
          },
        },
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              exclude: /node_modules/,
              use: [
                { loader: GriffelCSSExtractionPlugin.loader },
                { loader: "@griffel/webpack-loader" },
              ],
            },
          ],
        },
      },
    },
  }),
}));
