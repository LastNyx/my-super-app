import { createSignal, onMount, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { videoList } from "../../consts/VideoList.ts";

interface CinematicSplashProps {
  from?: "AV" | "MM";
  to?: "AV" | "MM";
  origin?: { x: number; y: number };
  toVideoIndex: number;
  onMidway?: () => void;
  onComplete?: () => void;
}

export default function CinematicSplash(props: CinematicSplashProps) {
  let containerRef: HTMLDivElement | undefined;
  const [videoError, setVideoError] = createSignal(false);
  const [opacity, setOpacity] = createSignal(0);
  const [clipPath, setClipPath] = createSignal("circle(0% at 50% 50%)");

  const clip = (r: string) => `circle(${r} at 50% 50%)`;

  const textStyles = () =>
    props.to === "MM"
      ? "text-green-400 drop-shadow-[0_0_10px_#22c55e]"
      : "text-pink-400 drop-shadow-[0_0_10px_#ec4899]";

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  onMount(async () => {
    // Circle out (expand)
    setOpacity(1);
    setClipPath(clip("160vmax"));

    await sleep(1100);
    props.onMidway?.();

    // Hold
    await sleep(400);

    // Circle in (close)
    setClipPath(clip("0%"));
    await sleep(900);

    // Wait a bit extra to ensure fade visually completes
    await sleep(400); // 👈 this is the key buffer

    setOpacity(0);
    await sleep(300); // fade-out transition time

    props.onComplete?.(); // now it's *truly* done
  });

  // onMount(async () => {
  //   // Circle out (expansion)
  //   setOpacity(1);
  //   setClipPath(clip("160vmax"));

  //   await new Promise((res) => setTimeout(res, 1100));
  //   props.onMidway?.();

  //   // Small hold
  //   await new Promise((res) => setTimeout(res, 400));

  //   // Circle in (close)
  //   setOpacity(0);
  //   setClipPath(clip("0%"));

  //   await new Promise((res) => setTimeout(res, 900));
  //   props.onComplete?.();
  // });

  const selectedVideo = () => videoList[props.toVideoIndex];
  const showVideo = () => props.to === "AV" && selectedVideo() && !videoError();

  return (
    <div
      ref={containerRef}
      class="absolute inset-0 z-50 flex items-center justify-center overflow-hidden will-change-transform will-change-opacity"
      style={{
        opacity: opacity(),
        "clip-path": clipPath(),
        transition:
          "opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1), clip-path 1.1s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* --- BACKGROUND Money Management --- */}
      <Show when={props.to === "MM"}>
        <Motion.div
          class="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(34,197,94,0.9) 0%, black 80%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      </Show>

      {/* --- BACKGROUND AV Library (Video or Fallback) --- */}
      <Show when={props.to === "AV"}>
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
              transition={{ duration: 1 }}
            />
          }
        >
          <Motion.video
            class="absolute inset-0 w-full h-full object-cover"
            src={selectedVideo()}
            autoplay
            loop
            muted
            playsinline
            onError={() => setVideoError(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, easing: "ease-in-out" }}
          />
        </Show>

        <Motion.div
          class="absolute inset-0 bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      </Show>

      {/* --- TITLE --- */}
      <Motion.h1
        class={`relative z-10 text-3xl sm:text-5xl font-extrabold tracking-widest ${textStyles()}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          textShadow:
            props.to === "MM"
              ? ["0 0 10px #22c55e", "0 0 15px #22c55e", "0 0 10px #22c55e"]
              : ["0 0 10px #ec4899", "0 0 15px #ec4899", "0 0 10px #ec4899"],
        }}
        transition={{
          opacity: { duration: 0.6 },
          scale: {
            duration: 2,
            repeat: Infinity,
            direction: "alternate",
            easing: "ease-in-out",
          },
          textShadow: {
            duration: 2.5,
            repeat: Infinity,
            direction: "alternate",
            easing: "ease-in-out",
          },
        }}
      >
        {props.to === "MM"
          ? "MONEY MANAGEMENT MODE..."
          : "ENTERING JAV MODE..."}
      </Motion.h1>
    </div>
  );
}
