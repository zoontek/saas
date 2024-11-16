import { renderToString } from "react-dom/server";
import { App } from "./App";

export const render = () => renderToString(<App />);

export type ServerApi = {
  render: typeof render;
};
