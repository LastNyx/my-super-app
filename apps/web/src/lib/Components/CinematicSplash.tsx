import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { videoList } from "../../consts/VideoList.ts";

export default function CinematicSplash({
  to,
  toVideoIndex,
  onMidway,
  onComplete,
}: {
  from?: "AV" | "MM";
  to: "AV" | "MM";
  origin?: { x: number; y: number };
  toVideoIndex: number;
  onMidway?: () => void;
  onComplete?: () => void;
}) {
  const controls = useAnimationControls();
  const clip = (r: string) => `circle(${r} at 50% 50%)`;
  const [videoError, setVideoError] = useState(false);

  const textStyles =
    to === "MM"
      ? "text-green-400 drop-shadow-[0_0_10px_#22c55e]"
      : "text-pink-400 drop-shadow-[0_0_10px_#ec4899]";

  useEffect(() => {
    const run = async () => {
      // Circle out (expansion)
      await controls.start({
        opacity: 1,
        clipPath: clip("160vmax"),
        transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      });
      onMidway?.();

      // Small hold
      await new Promise((res) => setTimeout(res, 400));

      // Circle in (close)
      await controls.start({
        opacity: 0,
        clipPath: clip("0%"),
        transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
      });
      onComplete?.();
    };
    run();
  }, [controls, onComplete, onMidway]);

  const selectedVideo = videoList[toVideoIndex];
  const showVideo = to === "AV" && selectedVideo && !videoError;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden will-change-transform will-change-opacity"
      initial={{ opacity: 0, clipPath: clip("0%") }}
      animate={controls}
    >
      {/* --- BACKGROUND Money Management --- */}
      {to === "MM" && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(34,197,94,0.9) 0%, black 80%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* --- BACKGROUND AV Library (Video or Fallback) --- */}
      {to === "AV" && (
        <>
          {showVideo ? (
            <motion.video
              key={toVideoIndex}
              className="absolute inset-0 w-full h-full object-cover"
              src={selectedVideo}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(236,72,153,0.5) 0%, black 80%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
          )}
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
        </>
      )}

      {/* --- TITLE --- */}
      <motion.h1
        className={`relative z-10 text-3xl sm:text-5xl font-extrabold tracking-widest ${textStyles}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          textShadow:
            to === "MM"
              ? ["0 0 10px #22c55e", "0 0 15px #22c55e", "0 0 10px #22c55e"]
              : ["0 0 10px #ec4899", "0 0 15px #ec4899", "0 0 10px #ec4899"],
        }}
        transition={{
          opacity: { duration: 0.6 },
          scale: {
            duration: 2,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          },
          textShadow: {
            duration: 2.5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          },
        }}
      >
        {to === "MM" ? "MONEY MANAGEMENT MODE..." : "ENTERING JAV MODE..."}
      </motion.h1>
    </motion.div>
  );
}
