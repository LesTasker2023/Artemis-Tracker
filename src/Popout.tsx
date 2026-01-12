/**
 * Popout Entry Point
 * Separate entry for the popout stats window
 * Supports V1 (current) and V2 (rebuilt) versions
 */

import React from "react";
import ReactDOM from "react-dom/client";
import PopoutStats from "./components/PopoutStats"; // V1
import PopoutStatsV2 from "./components/PopoutStatsV2"; // V2
import "./index.css";

// Version selection from localStorage
const VERSION_KEY = "artemis-popout-version";
const version = localStorage.getItem(VERSION_KEY) || "v2"; // Default to V2 for testing

const PopoutComponent = version === "v2" ? PopoutStatsV2 : PopoutStats;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopoutComponent />
  </React.StrictMode>
);
