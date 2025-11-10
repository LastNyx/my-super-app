import { useLocation, useNavigate } from "@solidjs/router";
import { onMount, Show } from "solid-js";
import { videoList } from "../../consts/VideoList";
import AVLibraryHome from "../../pages/JAVLibrary/JAVLibraryHome";
import MoneyManagementHome from "../../pages/MoneyManagement/MoneyManagementHome";
import { setSplashData, splashData } from "../Store/SplashStore";

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

  const handleToggle = () => {
    const to = location.pathname === "/jav-library" ? "MM" : "AV";
    const from = to === "AV" ? "MM" : "AV";

    setSplashData({
      active: true,
      from,
      to,
      videoIndex: Math.floor(Math.random() * videoList.length),
    });
  };

  // const handleToggle = (e: MouseEvent) => {
  //   const target = e.currentTarget as HTMLElement;
  //   const rect = target.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;
  //   setOrigin({ x, y });

  //   const to = currentMode() === "MM" ? "AV" : "MM";
  //   setNextMode(to);

  //   if (to === "AV") {
  //     setVideoIndex(Math.floor(Math.random() * (videoList?.length ?? 1)));
  //   }

  //   setShowSplash(true);
  // };

  return (
    <div class="relative w-full h-screen overflow-hidden">
      <Show
        when={currentMode() === "MM"}
        fallback={
          <AVLibraryHome
            onSwitch={handleToggle}
            initialVideo={splashData.videoIndex ?? 0}
          />
        }
      >
        <MoneyManagementHome onSwitch={handleToggle} />
      </Show>
    </div>
  );
}
