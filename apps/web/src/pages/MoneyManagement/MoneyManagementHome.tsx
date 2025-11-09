import { motion } from "framer-motion";

export default function MoneyManagementHome({
  onSwitch,
}: {
  onSwitch: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-green-400 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/10 to-black" />

      <motion.div
        className="z-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
      >
        <h1 className="text-5xl font-bold mb-6 drop-shadow-[0_0_20px_#00ff88]">
          Money Management
        </h1>
        <motion.button
          onClick={onSwitch}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 20px rgba(0,255,136,0.5)",
          }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-full bg-green-700/80 hover:bg-green-500/90 shadow-[0_0_20px_#00ff8877] hover:text-shadow-white transition"
        >
          Switch to JAV Mode
        </motion.button>
      </motion.div>
    </div>
  );
}
