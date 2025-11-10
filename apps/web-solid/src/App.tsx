import { Router } from "@solidjs/router";
import { Route } from "@solidjs/router";
import Home from "./lib/Layout/Home.tsx";

export default function AppRoot() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/money-management" component={Home} />
      <Route path="/jav-library" component={Home} />
    </Router>
  );
}
