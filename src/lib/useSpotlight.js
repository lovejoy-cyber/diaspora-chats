import { useRef, useCallback } from "react";

// Attaches a genuine pointer-reactive "spotlight" effect to any element — a soft glow
// that follows the actual mouse/touch position, not a fixed animation. Sets CSS custom
// properties (--spot-x, --spot-y) that the .spotlight CSS class uses to position a
// radial gradient exactly where the cursor is. This is what makes it feel truly
// interactive rather than just "always glowing."
export function useSpotlight() {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spot-x", x + "%");
    el.style.setProperty("--spot-y", y + "%");
  }, []);

  return {
    ref,
    onMouseMove: handleMove,
    onTouchMove: handleMove,
    onTouchStart: handleMove,
  };
}
