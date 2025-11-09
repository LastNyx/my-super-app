import { RouterProvider } from "react-router-dom";
import DataRoute from "./Routes/DataRoute.tsx";

export default function AppRoot() {
  return <RouterProvider router={DataRoute()} />;
}
