import { useEffect, useRef } from 'react';
import { C } from './theme.js';

export default function AmbientBackground() {
  const bgRef = useRef(null);
  const isDark = C.bg === '#050505';

  useEffect(() => {
    const scrollContainer = document.querySelector('.msg-scroll');
    if (!scrollContainer) return;
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shiftY = Math.min(10, scrollContainer.scrollTop * 0.02);
          if (bgRef.current) {
            bgRef.current.style.transform = `translate3d(0, -${shiftY}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={bgRef} style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      transform: `translate3d(0, 0, 0)`,
      transition: 'transform 0.1s linear'
    }}>
      {/* Subtle Premium Glow at the top edge */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120vw',
        height: '40vh',
        background: `radial-gradient(ellipse at top, ${isDark ? 'rgba(255, 45, 45, 0.06)' : 'rgba(255, 45, 45, 0.04)'} 0%, transparent 70%)`,
        opacity: 0.8,
        filter: 'blur(40px)',
      }} />
    </div>
  );
}
