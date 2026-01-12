/**
 * Popout Entry Point
 * Separate entry for the popout stats window
 */

import React from "react";
import ReactDOM from "react-dom/client";
import PopoutStatsV2 from "./components/PopoutStatsV2";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopoutStatsV2 />
  </React.StrictMode>
);
