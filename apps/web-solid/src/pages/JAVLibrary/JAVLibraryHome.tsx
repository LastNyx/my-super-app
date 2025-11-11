import {
  createSignal,
  onMount,
  onCleanup,
  Show,
  For,
  createEffect,
} from "solid-js";
import { Motion, Presence } from "solid-motionone";
import { videoList } from "../../consts/VideoList.ts";

interface AVLibraryHomeProps {
  initialVideo?: number;
  onSwitch: (e: MouseEvent) => void;
}

export default function AVLibraryHome(props: AVLibraryHomeProps) {
  const [index, setIndex] = createSignal(props.initialVideo ?? 1);
  const [videoError, setVideoError] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(true);
  const [volume, setVolume] = createSignal(0);
  const [showControls, setShowControls] = createSignal(false);
  const [controlsVisible, setControlsVisible] = createSignal(true);
  let videoRef: HTMLVideoElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let hideControlsTimer: ReturnType<typeof setTimeout>;
  const [isFullscreen, setIsFullscreen] = createSignal(false);

  // 🔊 Update volume independently (only track volume changes)
  createEffect(() => {
    const vol = volume(); // Only track volume
    if (videoRef) {
      // Apply muted/volume DOM properties. Respect explicit mute state
      // (muted() true) but also consider slider at 0.
      videoRef.muted = muted() || vol === 0;
      videoRef.volume = vol / 100;
    }
  });

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying()) {
        videoRef.pause();
        setIsPlaying(false);
      } else {
        attemptPlay();
        setIsPlaying(true);
      }
    }
  };

  const handlePrev = () => {
    if (videoList.length > 1) {
      const newIndex = (index() - 1 + videoList.length) % videoList.length;
      setIndex(newIndex);
      // setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (videoList.length > 1) {
      const newIndex = (index() + 1) % videoList.length;
      setIndex(newIndex);
      // setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const v = Number(target.value);
    setVolume(v);
    // update muted state when slider hits 0
    if (v === 0) {
      setMuted(true);
      if (videoRef) videoRef.muted = true;
    } else {
      setMuted(false);
      if (videoRef) videoRef.muted = false;
      if (videoRef) videoRef.volume = v / 100;
    }
    try {
      localStorage.setItem("jav.volume", String(v));
      localStorage.setItem("jav.muted", String(muted()));
    } catch (e) {}
  };

  const changeVolumeBy = (delta: number) => {
    const newV = Math.max(0, Math.min(100, volume() + delta));
    setVolume(newV);
    if (videoRef) {
      videoRef.volume = newV / 100;
      // if volume becomes >0, ensure unmuted
      if (newV > 0) {
        videoRef.muted = false;
        setMuted(false);
      } else {
        videoRef.muted = true;
        setMuted(true);
      }
    }
    try {
      localStorage.setItem("jav.volume", String(newV));
      localStorage.setItem("jav.muted", String(muted()));
    } catch (e) {}
  };

  const seekBy = (seconds: number) => {
    if (!videoRef) return;
    const dur = duration();
    const t = videoRef.currentTime || 0;
    const newTime = Math.max(0, Math.min(dur || Infinity, t + seconds));
    videoRef.currentTime = newTime;
    setProgress(newTime);
  };

  const toggleMute = () => {
    const next = !muted();
    setMuted(next);
    if (!videoRef) return;
    // If unmuting while volume is 0, give it a reasonable default
    if (!next && volume() === 0) {
      setVolume(50);
      videoRef.volume = 0.5;
    }
    videoRef.muted = next;
    try {
      localStorage.setItem("jav.muted", String(next));
      localStorage.setItem("jav.volume", String(volume()));
    } catch (e) {}
  };

  const formatTime = (t: number) => {
    if (!isFinite(t) || t <= 0) return "0:00";
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    const m = Math.floor(t / 60);
    return `${m}:${s}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef) return;
    const t = videoRef.currentTime || 0;
    if (!isSeeking()) setProgress(t);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef) return;
    setDuration(videoRef.duration || 0);
  };

  const handleSeekInput = (e: Event) => {
    const v = Number((e.target as HTMLInputElement).value);
    const dur = duration();
    if (!videoRef || !dur) return;
    const newTime = (v / 100) * dur;
    setProgress(newTime);
    videoRef.currentTime = newTime;
  };

  const handleSeekStart = () => setIsSeeking(true);
  const handleSeekEnd = () => setIsSeeking(false);

  // const handleMouseMove = () => {
  //   setShowControls(true);
  //   clearTimeout(hideControlsTimer);
  //   hideControlsTimer = setTimeout(() => setShowControls(false), 3000);
  // };
  const handleMouseMove = () => {
    if (controlsVisible() || isFullscreen()) {
      setShowControls(true);
      clearTimeout(hideControlsTimer);
      hideControlsTimer = setTimeout(() => setShowControls(false), 3000);
    }
  };

  onCleanup(() => {
    clearTimeout(hideControlsTimer);
  });

  const selectedVideo = () => videoList[index()];
  const showVideo = () => selectedVideo() && !videoError();
  const hasMultiple = () => videoList.length > 1;

  const [videoMount, setVideoMount] = createSignal(true);
  const [progress, setProgress] = createSignal(0);
  const [duration, setDuration] = createSignal(0);
  const [isSeeking, setIsSeeking] = createSignal(false);
  const [muted, setMuted] = createSignal(false);
  const [autoplayBlocked, setAutoplayBlocked] = createSignal(false);
  const [shouldRestoreMute, setShouldRestoreMute] = createSignal(false);
  let savedMutedBeforeAutoplay = false;

  const navItems = ["Video Library", "Artists", "Genres", "Publishers"];

  createEffect(() => {
    const next = (index() + 1) % videoList.length;
    const preload = document.createElement("video");
    preload.src = videoList[next];
    preload.preload = "auto";
  });

  // Fullscreen API wiring: keep `isFullscreen` in sync with document state
  onMount(() => {
    // load persisted volume/mute
    try {
      const savedV = localStorage.getItem("jav.volume");
      const savedM = localStorage.getItem("jav.muted");
      if (savedV !== null) setVolume(Number(savedV));
      if (savedM !== null) setMuted(savedM === "true");
    } catch (e) {}

    const onFullChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen()) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          changeVolumeBy(5);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolumeBy(-5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(5);
          break;
      }
    };

    document.addEventListener("fullscreenchange", onFullChange);
    document.addEventListener("keydown", onKeyDown);

    const onUserInteract = () => {
      if (shouldRestoreMute() && videoRef) {
        // restore previous mute state saved before autoplay fallback
        setMuted(savedMutedBeforeAutoplay);
        videoRef.muted = savedMutedBeforeAutoplay;
        setShouldRestoreMute(false);
        setAutoplayBlocked(false);

        // try to play again (user gesture should allow unmuted play)
        attemptPlay();
      }
    };

    document.addEventListener("pointerdown", onUserInteract);

    onCleanup(() => {
      document.removeEventListener("fullscreenchange", onFullChange);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onUserInteract);
    });
  });

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen()) {
        await (containerRef?.requestFullscreen?.() ??
          (containerRef as any)?.webkitRequestFullscreen?.());
      } else {
        await (document.exitFullscreen?.() ??
          (document as any).webkitExitFullscreen?.());
      }
    } catch (e) {
      // ignore
    }
  };

  // Try to play and handle autoplay restrictions: if play() is rejected
  // due to autoplay policy, temporarily mute and attempt to play. Mark
  // that we should restore the previous mute state on first user gesture.
  const attemptPlay = async () => {
    if (!videoRef) return;
    try {
      await videoRef.play();
      setIsPlaying(true);
      return;
    } catch (err: any) {
      // If autoplay blocked, try muting temporarily and play again
      const name = err?.name || "";
      const msg = String(err?.message || "");
      const blocked =
        name === "NotAllowedError" ||
        /not allowed|interrupted|play.*policy/i.test(msg);
      if (blocked) {
        savedMutedBeforeAutoplay = muted();
        setMuted(true);
        if (videoRef) videoRef.muted = true;
        setAutoplayBlocked(true);
        setShouldRestoreMute(true);
        try {
          await videoRef.play();
          setIsPlaying(true);
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Ensure the video element actually loads the new src and displays frames
  // when the index changes. Some browsers may play audio but not render
  // video frames unless load() is called or the element is remounted.
  // Keyed-remount alternative: toggle mounting of the <video/> element so the
  // browser creates a fresh element when the index changes. This eliminates
  // stale renderer state that sometimes results in audio playing without
  // visible frames when swapping sources (especially with .mov files).
  createEffect(() => {
    const current = index(); // subscribe to index changes only
    const src = videoList[current];
    if (!src) return;

    // Unmount current element and remount shortly after to force a fresh
    // media element creation. Use small delays to let Solid update the DOM.
    setVideoMount(false);
    setTimeout(() => {
      setVideoMount(true);
      // After remount, the ref should be repopulated. Give it a tick then
      // set the src and play.
      setTimeout(() => {
        try {
          if (!videoRef) return;
          videoRef.src = src;
          videoRef.currentTime = 0;
          // Ensure muted and volume are applied before playing so audio doesn't
          // briefly play when volume is 0 and the correct level is used.
          videoRef.muted = volume() === 0;
          videoRef.volume = volume() / 100;
          videoRef.load();
          attemptPlay();
          setIsPlaying(true);
          // reset progress/duration for the new source
          setProgress(0);
          setDuration(0);
        } catch (e) {
          // ignore
        }
      }, 40);
    }, 30);
  });

  return (
    <div
      ref={containerRef}
      class="relative min-h-screen overflow-hidden text-white font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* 🎥 Background video */}
      <Show when={hasMultiple()}>
        <Presence exitBeforeEnter>
          <Show
            when={showVideo()}
            fallback={
              <Motion.div
                class="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(236,72,153,0.5) 0%, black 80%)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              />
            }
          >
            <Show when={videoMount()}>
              <Motion.video
                class="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                src={selectedVideo()}
                ref={videoRef}
                autoplay
                loop
                playsinline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadedData={() => {
                  // Ensure muted reflects the slider before playing (avoid
                  // brief audio when volume is 0), then play.
                  if (videoRef) videoRef.muted = volume() === 0;
                  if (videoRef) videoRef.volume = volume() / 100;
                  attemptPlay();
                  setIsPlaying(true);
                }}
                onError={() => setVideoError(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, easing: "ease-in-out" }}
              />
            </Show>
          </Show>
        </Presence>
      </Show>

      <Show when={!hasMultiple()}>
        <Presence exitBeforeEnter>
          <Show when={videoMount()}>
            <Motion.video
              class="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              src={selectedVideo()}
              ref={videoRef}
              autoplay
              loop
              // muted
              playsinline
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={() => {
                // Ensure muted reflects the slider before playing
                if (videoRef) videoRef.muted = volume() === 0;
                if (videoRef) videoRef.volume = volume() / 100;
                attemptPlay();
                setIsPlaying(true);
              }}
              onError={() => setVideoError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, easing: "ease-in-out" }}
            />
          </Show>
        </Presence>
      </Show>

      {/* 🖤 Overlay */}
      <Show when={!isFullscreen()}>
        <div class="absolute inset-0 bg-black/70 pointer-events-none z-10" />
      </Show>

      {/* 🌐 Header */}
      <Show when={!isFullscreen()}>
        <Motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          class="absolute top-0 left-0 w-full flex items-center justify-between px-12 py-6 text-sm tracking-wide pointer-events-auto z-30"
        >
          <div class="font-semibold flex items-center gap-2">
            <span class="w-3 h-3 bg-pink-600/70 rounded-sm animate-[pink-glow_2s_ease-in-out_infinite_alternate]" />
            <span class="hover:[text-shadow:0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9]">
              LastNyx
            </span>
          </div>
          <nav class="flex gap-10 text-gray-300">
            <For each={navItems}>
              {(item) => (
                <a
                  href="#"
                  class="hover:text-white hover:[text-shadow:0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9] transition"
                >
                  {item}
                </a>
              )}
            </For>
          </nav>
          <button
            onClick={props.onSwitch}
            class="px-4 py-2 border border-white/30 rounded-full text-sm hover:bg-white hover:text-black shadow-[0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9] transition"
          >
            Switch Mode
          </button>
        </Motion.header>
      </Show>

      {/* 💬 Main Content */}
      <Show when={!isFullscreen()}>
        <div class="relative z-10 flex items-center justify-start min-h-screen px-20 pointer-events-auto">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            class="max-w-2xl"
          >
            <h1 class="text-6xl font-bold mb-6 leading-tight">
              Welcome to JAV Mode
            </h1>
            <p class="text-gray-300 uppercase tracking-wider mb-8 text-sm">
              The darker, more playful side of your universe ✨
            </p>
            <ul class="text-gray-400 text-sm mb-10 space-y-1">
              <li>A. Where You Bookmark Your Jav Movies</li>
              <li>B. Extend to Some Streaming Service</li>
              <li>C. The Timeless Beauty of Japanese Adult Artists</li>
            </ul>
            <button
              onClick={props.onSwitch}
              class="px-6 py-3 rounded-full border border-white/40 hover:bg-white hover:text-black transition text-sm shadow-[0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9]"
            >
              Browse the Video Library
            </button>
          </Motion.div>
        </div>
      </Show>

      {/* 🔖 Footer */}
      <Show when={!isFullscreen()}>
        <footer class="absolute bottom-5 left-0 w-full text-center text-xs text-gray-400 z-20">
          ©{new Date().getFullYear()} Personal – LastNyx
        </footer>
      </Show>

      {/* 🎮 Floating Video Controls */}
      {/* ✅ Toggle + Fullscreen Buttons — visible when not in video-only fullscreen */}
      <Show when={!isFullscreen()}>
        <Motion.button
          onClick={() => setControlsVisible(!controlsVisible())}
          // initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          class="absolute bottom-6 right-20 z-30 w-12 h-12 flex items-center justify-center rounded-full
            bg-black/60 backdrop-blur-md border border-white/20 hover:bg-pink-600/80
               transition shadow-[0_0_20px_rgba(236,72,153,0.3)] pointer-events-auto"
          title={controlsVisible() ? "Hide Controls" : "Show Controls"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={`transition-transform ${controlsVisible() ? "rotate-180" : ""}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </Motion.button>

        <Motion.button
          onClick={toggleFullscreen}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          class="absolute bottom-6 right-6 z-30 w-12 h-12 flex items-center justify-center rounded-full
            bg-black/60 backdrop-blur-md border border-white/20 hover:bg-pink-600/80
               transition shadow-[0_0_20px_rgba(236,72,153,0.3)] pointer-events-auto"
          title="Enter video-only fullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v3" />
            <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </Motion.button>
      </Show>

      {/* Exit fullscreen button — shown when in video-only fullscreen */}
      <Show when={isFullscreen()}>
        <Motion.button
          onClick={toggleFullscreen}
          animate={{ opacity: 1 }}
          transition={{ delay: 0 }}
          class="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full
            bg-black/40 backdrop-blur-md border border-white/10 hover:bg-pink-600/80
               transition shadow-[0_0_20px_rgba(236,72,153,0.3)] pointer-events-auto"
          title="Exit fullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 14L5 18" />
            <path d="M5 18V14H9" />
            <path d="M15 10l4-4" />
            <path d="M19 6V10H15" />
          </svg>
        </Motion.button>
      </Show>

      {/* 🎚 Controls Bar */}
      <Show when={controlsVisible() && hasMultiple()}>
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: showControls() ? 1 : 0,
            y: showControls() ? 0 : 20,
          }}
          transition={{ duration: 0.3 }}
          class="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto"
        >
          <div class="flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-full px-6 py-4 border border-white/20 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white"
              title="Previous"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              class="w-12 h-12 flex items-center justify-center rounded-full bg-pink-600/80 hover:bg-pink-600 transition shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              title={isPlaying() ? "Pause" : "Play"}
            >
              <Show
                when={isPlaying()}
                fallback={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </Show>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white"
              title="Next"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            {/* Timeline / Divider */}
            <div class="flex items-center gap-3 px-2">
              <span class="text-xs text-gray-400 w-10">
                {formatTime(progress())}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={duration() ? (progress() / duration()) * 100 : 0}
                onInput={handleSeekInput}
                onPointerDown={handleSeekStart}
                onPointerUp={handleSeekEnd}
                class="w-64 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-600
                         [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(236,72,153,0.8)]"
                style={{
                  background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${duration() ? (progress() / duration()) * 100 : 0}%, rgba(255,255,255,0.2) ${duration() ? (progress() / duration()) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
              <span class="text-xs text-gray-400 w-10">
                {formatTime(duration())}
              </span>
            </div>
            <div class="w-px h-8 bg-white/20" />

            {/* Volume Control */}
            <div class="flex items-center gap-3">
              <button
                onClick={toggleMute}
                class="flex items-center justify-center w-6 h-6 text-white"
                title={muted() ? "Unmute" : "Toggle mute"}
              >
                <Show
                  when={!muted()}
                  fallback={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M11 5 6 9H2v6h4l5 4V5z" />
                    </svg>
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </Show>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume()}
                onInput={handleVolumeChange}
                class="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-600
                         [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(236,72,153,0.8)]
                         [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-pink-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${volume()}%, rgba(255,255,255,0.2) ${volume()}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
              <span class="text-xs text-gray-400 w-8">{volume()}%</span>
            </div>
          </div>
        </Motion.div>
      </Show>
    </div>
  );
}
