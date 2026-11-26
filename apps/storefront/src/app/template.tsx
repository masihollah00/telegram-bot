
"use client";

import { useEffect, useRef } from "react";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const entrance = page.animate(
      [
        {
          opacity: 0,
          transform: "scale(0.985)",
          filter: "blur(9px)",
          clipPath: "inset(2% 0 2% 0)",
        },
        {
          opacity: 1,
          transform: "scale(1)",
          filter: "blur(0)",
          clipPath: "inset(0 0 0 0)",
        },
      ],
      {
        duration: 680,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }
    );

    return () => entrance.cancel();
  }, []);

  return (
    <div className="jalali-page-transition">
      <div
        ref={pageRef}
        className="jalali-page-content"
      >
        {children}
      </div>

      <style jsx global>{`
        .jalali-page-transition {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
        }

        .jalali-page-content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          transform-origin: center top;
          will-change: opacity, transform, filter;
        }

        @media (prefers-reduced-motion: reduce) {
          .jalali-page-content {
            animation: none !important;
            filter: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
