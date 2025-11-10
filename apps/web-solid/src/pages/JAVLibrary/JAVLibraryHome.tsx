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
  const [index, setIndex] = createSignal(props.initialVideo ?? 0);
  const [videoError, setVideoError] = createSignal(false);
  let videoRef: HTMLVideoElement | undefined;

  // 🔄 Only schedule if more than 1 video
  onMount(() => {
    if (!videoList || videoList.length < 2) return;

    let timer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const nextDelay = 15000 + Math.random() * 15000;
      timer = setTimeout(() => {
        const newIndex = Math.floor(Math.random() * videoList.length);
        setIndex(newIndex);
        scheduleNext();
      }, nextDelay);
    };
    scheduleNext();

    onCleanup(() => clearTimeout(timer));
  });

  // 🎬 Directly update the src without remount
  createEffect(() => {
    if (videoRef && videoList[index()]) {
      const el = videoRef;
      if (el.src !== videoList[index()]) {
        el.src = videoList[index()];
        el.play().catch(() => {});
      }
    }
  });

  const selectedVideo = () => videoList[index()];
  const showVideo = () => selectedVideo() && !videoError();
  const hasMultiple = () => videoList.length > 1;

  const navItems = ["Video Library", "Artists", "Genres", "Publishers"];

  return (
    <div class="relative min-h-screen overflow-hidden text-white font-sans">
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
            <Motion.video
              class="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              src={selectedVideo()}
              ref={videoRef}
              autoplay
              loop
              muted
              playsinline
              onError={() => setVideoError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, easing: "ease-in-out" }}
            />
          </Show>
        </Presence>
      </Show>

      <Show when={!hasMultiple()}>
        <Presence exitBeforeEnter>
          <Motion.video
            class="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
            src={selectedVideo()}
            ref={videoRef}
            autoplay
            loop
            muted
            playsinline
            onError={() => setVideoError(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, easing: "ease-in-out" }}
          />
        </Presence>
      </Show>

      {/* 🖤 Overlay */}
      <div class="absolute inset-0 bg-black/70 pointer-events-none z-10" />

      {/* 🌐 Header */}
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

      {/* 💬 Main Content */}
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

      {/* 🔖 Footer */}
      <footer class="absolute bottom-5 left-0 w-full text-center text-xs text-gray-400 z-20">
        ©{new Date().getFullYear()} Personal – LastNyx
      </footer>
    </div>
  );
}
