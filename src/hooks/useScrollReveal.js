import { useEffect, useRef } from "react";

// Fades/slides elements with class "reveal" into view as they enter the
// viewport. Returns a ref to attach to the scroll container (or page root).
export function useScrollReveal(deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    const targets = root.querySelectorAll(".reveal:not(.is-visible)");
    if (targets.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}
