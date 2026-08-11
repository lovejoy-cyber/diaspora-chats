import { useSpotlight } from "../lib/useSpotlight";

// Wraps any content in a genuine pointer-reactive spotlight — safe to use inside a
// .map() loop (unlike calling useSpotlight directly in a list), since each instance
// gets its own hook call here, one per rendered card.
export default function SpotlightCard({ children, className = "", style, border = false }) {
  const spot = useSpotlight();
  const cls = "spotlight" + (border ? " spotlight-border" : "") + (className ? " " + className : "");
  return (
    <div ref={spot.ref} className={cls} style={style} onMouseMove={spot.onMouseMove} onTouchMove={spot.onTouchMove} onTouchStart={spot.onTouchStart}>
      {children}
    </div>
  );
}
