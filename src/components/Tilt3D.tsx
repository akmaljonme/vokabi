import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  onClick?: () => void;
  as?: "button" | "div";
}

/**
 * Sichqoncha pozitsiyasiga qarab kartani 3D tarzda og'diradigan
 * (tilt) wrapper. Karta ustida sichqonchani harakatlantirganda
 * u haqiqiy 3D obyekt kabi turli burchaklardan ko'rinadi, ichidagi
 * elementlar esa translateZ orqali "suzib" turadi.
 */
export const Tilt3D = ({ children, className = "", glow, onClick, as = "button" }: Tilt3DProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springCfg = { stiffness: 250, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [0, 1], [14, -14]), springCfg);
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), springCfg);
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const Comp: any = motion[as];

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <Comp
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileHover={{ scale: 1.035, z: 20 }}
        whileTap={{ scale: 0.96 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          ["--glow" as any]: glow || "#6366f1",
        }}
        className={`relative w-full h-full ${className}`}
      >
        {/* Yorug'lik nurlanishi — sichqoncha turgan joyga qarab siljiydi */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: useTransform(
              [glareX, glareY] as any,
              ([gx, gy]: any) => `radial-gradient(circle at ${gx} ${gy}, var(--glow) 0%, transparent 60%)`
            ) as any,
            mixBlendMode: "soft-light",
          }}
        />
        <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </Comp>
    </div>
  );
};
