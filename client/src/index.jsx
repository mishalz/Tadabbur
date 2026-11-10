import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter"; // provides the "Inter Variable" font used in index.css
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { UserContextProvider } from "./context/UserContext.jsx";
import { ResourcesContextProvider } from "./context/ResourcesContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <UserContextProvider>
      <ResourcesContextProvider>
        <App />
      </ResourcesContextProvider>
    </UserContextProvider>
  </BrowserRouter>,
);
