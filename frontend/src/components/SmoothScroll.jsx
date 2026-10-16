import { useEffect, useRef, createContext, useContext } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

export const SmoothScrollProvider = ({ children, targetRef }) => {
  const lenisInstanceRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const wrapper = targetRef?.current || undefined;
    const content = targetRef?.current?.firstElementChild || undefined;

    const lenis = new Lenis({
      wrapper: wrapper,
      content: content,
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisInstanceRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisInstanceRef.current = null;
    };
  }, [targetRef]);

  return (
    <LenisContext.Provider value={lenisInstanceRef.current}>
      {children}
    </LenisContext.Provider>
  );
};

export default SmoothScrollProvider;
