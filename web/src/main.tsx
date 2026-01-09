import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import "./i18n";
import { ThemeProvider } from "./theme";

import ThemeToggle from "./components/ThemeToggle";
import LangToggle from "./components/LangToggle";

import App from "./App";

import "./index.css";

// PWA SW register (prod build/preview)
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ThemeToggle />
        <LangToggle />

        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
