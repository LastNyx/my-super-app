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

  return (
    <div class="relative w-full h-screen overflow-hidden">
      <Show
        when={currentMode() === "MM"}
        fallback={
          <AVLibraryHome
            onSwitch={handleToggle}
            initialVideo={
              splashData.videoIndex ??
              Math.floor(Math.random() * videoList.length)
            }
          />
        }
      >
        <MoneyManagementHome onSwitch={handleToggle} />
      </Show>
    </div>
  );
}
