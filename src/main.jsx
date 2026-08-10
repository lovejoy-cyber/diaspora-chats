import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the theme before React even mounts, so Login/Register/ProfileSetup (which render
// before Dashboard ever does) respect the saved preference from the very first paint,
// instead of flashing dark and then switching once Dashboard's own effect runs.
document.documentElement.setAttribute("data-theme", localStorage.getItem("dl_theme") || "light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
