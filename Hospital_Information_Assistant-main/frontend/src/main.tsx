/**
 * Entry Point — Hospital Information Assistant
 *
 * Why it is written:
 * To bootstrap the React 18 application and render the root App component
 * inside the HTML root element.
 *
 * What it does:
 * - Imports React's StrictMode, createRoot, global CSS, and the App component.
 * - Mounts the application onto the DOM element with id 'root'.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
