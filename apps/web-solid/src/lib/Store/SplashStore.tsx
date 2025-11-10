import { createStore } from "solid-js/store";

type SplashMode = "MM" | "AV";

interface SplashData {
  active: boolean;
  from?: SplashMode;
  to?: SplashMode;
  videoIndex?: number;
  nextMode?: SplashMode;
}

export const [splashData, setSplashData] = createStore<SplashData>({
  active: false,
});
