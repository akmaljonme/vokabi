import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export const CustomCursor3D = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return;
    let x = 0, y = 0, tx = 0, ty = 0;
    let isHovering = false;
    let raf: number;

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };

    const onEnter = () => { isHovering = true; };
    const onLeave = () => { isHovering = false; };

    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("a,button,[role=button]").forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x - 20}px, ${y - 20}px) scale(${isHovering ? 1.8 : 1})`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${tx - 4}px, ${ty - 4}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{ transition: "transform 0.15s cubic-bezier(.17,.67,.83,.67), opacity 0.3s" }}
      >
        <div className="w-full h-full rounded-full border-2 border-white opacity-80" />
      </div>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999] mix-blend-difference"
        style={{ transition: "transform 0.05s linear" }}
      >
        <div className="w-full h-full rounded-full bg-white" />
      </div>
    </>
  );
};
