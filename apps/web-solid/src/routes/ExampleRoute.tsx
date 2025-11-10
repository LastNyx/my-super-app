import { Route } from "@solidjs/router";
import Home from "../lib/Layout/Home";
import { SplashContainer } from "../lib/Layout/SplashContainer";

function AppRoutes() {
  return (
    <>
      <Route path="/" component={SplashContainer}>
        <Route path="/" component={Home} />
        <Route path="/money-management" component={Home} />
        <Route path="/jav-library" component={Home} />
      </Route>
    </>
  );
}

export default AppRoutes;
