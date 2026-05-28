import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import App from "./App";
import "./index.css";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);
