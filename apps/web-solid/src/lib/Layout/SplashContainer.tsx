import { useNavigate } from "@solidjs/router";
import { Show, type ParentProps } from "solid-js";
import { Portal } from "solid-js/web";
import CinematicSplash from "../Components/CinematicSplash";
import { setSplashData, splashData } from "../Store/SplashStore";

export const SplashContainer = (props: ParentProps) => {
  const navigate = useNavigate();

  const handleSwitchMidway = () => {
    const to = splashData.to === "MM" ? "/money-management" : "/jav-library";
    setSplashData({ active: true, nextMode: splashData.to });
    navigate(to);
  };

  const handleSplashComplete = () => {
    setSplashData({ active: false });
  };

  return (
    <>
      <Show when={splashData.active}>
        <Portal mount={document.body}>
          <CinematicSplash
            from={splashData.from}
            to={splashData.to}
            toVideoIndex={splashData.videoIndex ?? 0}
            onMidway={handleSwitchMidway}
            onComplete={handleSplashComplete}
          />
        </Portal>
      </Show>

      {props.children}
    </>
  );
};
