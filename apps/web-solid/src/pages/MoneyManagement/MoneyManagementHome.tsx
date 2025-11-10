import { Motion } from "solid-motionone";

interface MoneyManagementHomeProps {
  onSwitch: (e: MouseEvent) => void;
}

export default function MoneyManagementHome(props: MoneyManagementHomeProps) {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center bg-black text-green-400 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-black via-green-950/10 to-black" />

      <Motion.div
        class="z-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1, easing: "ease-in-out" }}
      >
        <h1 class="text-5xl font-bold mb-6 drop-shadow-[0_0_20px_#00ff88]">
          Money Management
        </h1>
        <Motion.button
          onClick={props.onSwitch}
          animate={{
            scale: 1,
          }}
          hover={{
            scale: 1.05,
          }}
          press={{
            scale: 0.95,
          }}
          class="px-6 py-3 rounded-full bg-green-700/80 hover:bg-green-500/90 shadow-[0_0_20px_#00ff8877] transition"
          style={{
            "box-shadow": "0 0 20px rgba(0,255,136,0.5)",
          }}
        >
          Switch to JAV Mode
        </Motion.button>
      </Motion.div>
    </div>
  );
}
