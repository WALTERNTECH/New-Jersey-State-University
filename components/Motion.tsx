"use client";

import { useEffect, useRef, useState } from "react";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ""));
};

/**
 * A muted, looping background clip. The poster paints immediately; the video itself is fetched only
 * after the page has loaded, never on data-saver connections or for people who prefer reduced motion,
 * and it pauses whenever it is off screen.
 */
export function BackgroundVideo({ src, poster, className, delay = 0 }: { src: string; poster: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion() || saveData()) return;
    let io: IntersectionObserver | null = null;
    // Observing first means a clip hidden by CSS (display: none) is never downloaded at all.
    const start = () => {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            if (!v.src) {
              v.src = src;
              v.load();
            }
            v.play().catch(() => {});
          } else if (v.src) v.pause();
        },
        { threshold: 0.1 },
      );
      io.observe(v);
    };
    const kick = () => window.setTimeout(start, delay);
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });
    return () => {
      window.removeEventListener("load", kick);
      io?.disconnect();
    };
  }, [src, delay]);

  return (
    <video
      ref={ref}
      className={`${className ?? ""}${ready ? " playing" : ""}`}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setReady(true)}
    />
  );
}
