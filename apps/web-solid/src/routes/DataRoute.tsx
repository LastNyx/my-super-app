import { lazy, type JSXElement } from "solid-js";
import { Route, Navigate } from "@solidjs/router";

// Lazy load the Home component
const Home = lazy(() => import("../lib/Layout/Home.tsx"));

export interface AppRoute {
  path: string;
  element: JSXElement;
  layout?: "default" | "full";
}

const AppRoutes: AppRoute[] = [
  {
    path: "/",
    element: <Navigate href="/money-management" />,
    layout: "default",
  },
  {
    path: "/money-management",
    element: <Home />,
    layout: "default",
  },
  {
    path: "/jav-library",
    element: <Home />,
    layout: "default",
  },
];

const DataRoute = () => {
  return (
    <>
      {AppRoutes.map((route) => (
        <Route path={route.path} component={() => route.element} />
      ))}
    </>
  );
};

export default DataRoute;
