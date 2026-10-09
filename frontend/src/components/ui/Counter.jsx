import { useEffect, useRef, useState } from "react";

// "+38%" → ["+", 38, "%"]; values without a number are shown as-is
const split = (value) => {
  const match = String(value).match(/^(.*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, number, suffix] = match;
  const decimals = number.split(".")[1]?.length ?? 0;
  return { prefix, target: parseFloat(number.replace(/,/g, "")), suffix, decimals, grouped: number.includes(",") };
};

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up to the number inside `value` the first time it scrolls into view. */
export const Counter = ({ value, duration = 1200, className }) => {
  const parts = split(value);
  const ref = useRef(null);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!parts || !el || reduceMotion()) return;
    let frame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        setCurrent(parts.target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  if (!parts) return <span className={className}>{value}</span>;

  // the real number until the animation starts, so print/crawlers never see 0
  const shown = current ?? parts.target;
  const number = shown.toLocaleString("en", {
    minimumFractionDigits: parts.decimals,
    maximumFractionDigits: parts.decimals,
    useGrouping: parts.grouped,
  });
  return (
    <span ref={ref} className={className}>
      <span aria-hidden className="tabular-nums">
        {parts.prefix}
        {number}
        {parts.suffix}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
};
