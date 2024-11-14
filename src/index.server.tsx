import { renderToString } from "react-dom/server";
import { App } from "./App";

export const render = () => {
  const html = renderToString(<App />);
  return html;
};

export type ServerApi = {
  render: typeof render;
};
