import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
const container = document.getElementById("root");
if (!container)
    throw new Error("missing #root");
createRoot(container).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
