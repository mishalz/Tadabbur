import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "dotenv/config";
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
