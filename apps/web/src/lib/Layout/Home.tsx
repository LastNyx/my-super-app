import { useState } from "react";
import MoneyManagementHome from "../../pages/MoneyManagement/MoneyManagementHome.tsx";
import AVLibraryHome from "../../pages/JAVLibrary/AVLibraryHome.tsx";
import CinematicSplash from "../Components/CinematicSplash.tsx";
import { videoList } from "../../consts/VideoList.ts";
import { useLocation, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentMode: "AV" | "MM" =
    location.pathname === "/jav-library" ? "AV" : "MM";

  const [mode, setMode] = useState<"AV" | "MM">(currentMode);
  const [showSplash, setShowSplash] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [nextMode, setNextMode] = useState<"AV" | "MM">("MM");

  const handleToggle = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setOrigin({ x, y });

    const to = currentMode === "MM" ? "AV" : "MM";
    setNextMode(to);

    if (to === "AV") {
      setVideoIndex(Math.floor(Math.random() * (videoList?.length ?? 1)));
    }

    setShowSplash(true);
  };

  const handleSwitchMidway = () => {
    const to = nextMode === "MM" ? "/money-management" : "/jav-library";
    setMode(nextMode); // switch app during the circle expansion
    navigate(to, { replace: true });
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {currentMode === "MM" ? (
        <MoneyManagementHome onSwitch={handleToggle} />
      ) : (
        <AVLibraryHome onSwitch={handleToggle} initialVideo={videoIndex ?? 0} />
      )}

      {showSplash && (
        <CinematicSplash
          from={mode}
          to={nextMode}
          origin={origin}
          toVideoIndex={videoIndex ?? 0}
          onMidway={handleSwitchMidway}
          onComplete={handleSplashComplete}
        />
      )}
    </div>
  );
}
