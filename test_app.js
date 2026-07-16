import { renderToStaticMarkup } from "react-dom/server";
import App from "./src/App.tsx";
import React from "react";
try {
  const html = renderToStaticMarkup(React.createElement(App));
  console.log("Render succeeded!");
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
