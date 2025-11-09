import type { ReactElement } from "react";
import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import Home from "../lib/Layout/Home.tsx";
import { Navigate } from "react-router-dom";

// export type IRouteHandle = {
//   // breadcrumb?: (ItemType & { linkToKey?: boolean })[];
// };

// Extend the match type
// export type IMatchWithHandle = {
//   handle?: IRouteHandle;
// };

export interface AppRoute {
  path: string;
  element: ReactElement;
  layout?: "default" | "full";
  // handle?: IRouteHandle;
}

const AppRoutes: AppRoute[] = [
  {
    path: "/",
    element: <Navigate to="/money-management" replace />,
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
  const layoutGrouped: Record<string, RouteObject[]> = {
    default: [],
    full: [],
  };

  AppRoutes.forEach((route) => {
    if (!route.path) return;

    layoutGrouped[route.layout ?? "main"].push({
      path: route.path,
      element: <Suspense fallback={<></>}>{route.element}</Suspense>,
      // handle: route.handle,
    });
  });

  return createBrowserRouter([
    {
      // element: <DefaultLayout />,
      children: [...layoutGrouped.default],
    },
    {
      // element: <FullLayout />,
      children: [...layoutGrouped.full],
    },
  ]);
};

export default DataRoute;
