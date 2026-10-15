import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { HelloWorld } from "./frontend/components/HelloWorld";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

createRoot(app).render(
  <StrictMode>
    <HelloWorld />
  </StrictMode>
);
