import { Router } from "@solidjs/router";
import AppRoutes from "./routes/ExampleRoute.tsx";

export default function AppRoot() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
