import type React from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import "./app.css";

function App({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default App;
