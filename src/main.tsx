import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAppSW } from "./lib/registerSW";

registerAppSW();

createRoot(document.getElementById("root")!).render(<App />);
