/**
 * Popout Entry Point
 * Separate entry for the popout stats window
 */

import React from "react";
import ReactDOM from "react-dom/client";
import PopoutStats from "./components/PopoutStats";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopoutStats />
  </React.StrictMode>
);
