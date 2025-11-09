import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { videoList } from "../../consts/VideoList.ts";

export default function AVLibraryHome({
  initialVideo = 0,
  onSwitch,
}: {
  initialVideo?: number;
  onSwitch: (e: React.MouseEvent) => void;
}) {
  const [index, setIndex] = useState(initialVideo);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 🔁 Only schedule if more than 1 video
  useEffect(() => {
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

    return () => clearTimeout(timer);
  }, []);

  // 🎬 Directly update the src without remount
  useEffect(() => {
    if (videoRef.current && videoList[index]) {
      const el = videoRef.current;
      if (el.src !== videoList[index]) {
        el.src = videoList[index];
        el.play().catch(() => {});
      }
    }
  }, [index]);

  const selectedVideo = videoList[index];
  const showVideo = selectedVideo && !videoError;
  const hasMultiple = videoList.length > 1;

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-sans">
      {/* 🎥 Background video */}
      {hasMultiple ? (
        <AnimatePresence mode="wait">
          {showVideo ? (
            <motion.video
              key={index}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              src={selectedVideo}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
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
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.video
            key={index}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
            src={selectedVideo}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />
        </AnimatePresence>
      )}

      {/* 🖤 Overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none z-10" />

      {/* 🌐 Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute top-0 left-0 w-full flex items-center justify-between px-12 py-6 text-sm tracking-wide pointer-events-auto z-30"
      >
        <div className="font-semibold flex items-center gap-2">
          <span className="w-3 h-3 bg-pink-600/70 rounded-sm animate-[pink-glow_2s_ease-in-out_infinite_alternate]" />
          <span className="hover:[text-shadow:0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9]">
            LastNyx
          </span>
        </div>
        <nav className="flex gap-10 text-gray-300">
          {["Video Library", "Artists", "Genres", "Publishers"].map((t) => (
            <a
              key={t}
              href="#"
              className="hover:text-white hover:[text-shadow:0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9] transition"
            >
              {t}
            </a>
          ))}
        </nav>
        <button
          onClick={onSwitch}
          className="px-4 py-2 border border-white/30 rounded-full text-sm hover:bg-white hover:text-black shadow-[0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9] transition"
        >
          Switch Mode
        </button>
      </motion.header>

      {/* 💬 Main Content */}
      <div className="relative z-10 flex items-center justify-start min-h-screen px-20 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="max-w-2xl"
        >
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Welcome to JAV Mode
          </h1>
          <p className="text-gray-300 uppercase tracking-wider mb-8 text-sm">
            The darker, more playful side of your universe ✨
          </p>
          <ul className="text-gray-400 text-sm mb-10 space-y-1">
            <li>A. Where You Bookmark Your Jav Movies</li>
            <li>B. Extend to Some Streaming Service</li>
            <li>C. The Timeless Beauty of Japanese Adult Artists</li>
          </ul>
          <button
            onClick={onSwitch}
            className="px-6 py-3 rounded-full border border-white/40 hover:bg-white hover:text-black transition text-sm shadow-[0_0_5px_#ff3da9,0_0_15px_#ff3da9,0_0_25px_#ff3da9]"
          >
            Browse the Video Library
          </button>
        </motion.div>
      </div>

      {/* 📍 Footer */}
      <footer className="absolute bottom-5 left-0 w-full text-center text-xs text-gray-400 z-20">
        ©{new Date().getFullYear()} Personal — LastNyx
      </footer>
    </div>
  );
}
