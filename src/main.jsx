import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

const app = <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>;

createRoot(document.getElementById("root")).render(app);