import { createSignal, Show, onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import MoneyManagementHome from "../../pages/MoneyManagement/MoneyManagementHome.tsx";
import AVLibraryHome from "../../pages/JAVLibrary/JAVLibraryHome.tsx";
import CinematicSplash from "../Components/CinematicSplash.tsx";
import { videoList } from "../../consts/VideoList.ts";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect from "/" to "/money-management"
  onMount(() => {
    if (location.pathname === "/") {
      navigate("/money-management", { replace: true });
    }
  });

  const currentMode = (): "AV" | "MM" =>
    location.pathname === "/jav-library" ? "AV" : "MM";

  const [mode, setMode] = createSignal<"AV" | "MM">(currentMode());
  const [showSplash, setShowSplash] = createSignal(false);
  const [origin, setOrigin] = createSignal({ x: 0, y: 0 });
  const [videoIndex, setVideoIndex] = createSignal<number | null>(null);
  const [nextMode, setNextMode] = createSignal<"AV" | "MM">("MM");

  const handleToggle = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setOrigin({ x, y });

    const to = currentMode() === "MM" ? "AV" : "MM";
    setNextMode(to);

    if (to === "AV") {
      setVideoIndex(Math.floor(Math.random() * (videoList?.length ?? 1)));
    }

    setShowSplash(true);
  };

  const handleSwitchMidway = () => {
    const to = nextMode() === "MM" ? "/money-management" : "/jav-library";
    setMode(nextMode()); // switch app during the circle expansion
    navigate(to, { replace: true });
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div class="relative w-full h-screen overflow-hidden">
      <Show
        when={currentMode() === "MM"}
        fallback={
          <AVLibraryHome
            onSwitch={handleToggle}
            initialVideo={videoIndex() ?? 0}
          />
        }
      >
        <MoneyManagementHome onSwitch={handleToggle} />
      </Show>

      <Show when={showSplash()}>
        <CinematicSplash
          from={mode()}
          to={nextMode()}
          origin={origin()}
          toVideoIndex={videoIndex() ?? 0}
          onMidway={handleSwitchMidway}
          onComplete={handleSplashComplete}
        />
      </Show>
    </div>
  );
}
