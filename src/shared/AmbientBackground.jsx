import { useEffect, useRef } from 'react';
import { C } from './theme.js';

export default function AmbientBackground() {
  const bgRef = useRef(null);
  const isDark = !C.isLight;

  useEffect(() => {
    const scrollContainer = document.querySelector('.msg-scroll');
    if (!scrollContainer) return;
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shiftY = Math.min(12, scrollContainer.scrollTop * 0.025);
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
      {/* Primary accent glow — top center */}
      <div style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '140vw',
        height: '45vh',
        background: `radial-gradient(ellipse at top, ${isDark ? 'rgba(229, 57, 53, 0.07)' : 'rgba(229, 57, 53, 0.05)'} 0%, transparent 68%)`,
        filter: 'blur(30px)',
      }} />
      {/* Secondary blue accent — bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-10%',
        width: '60vw',
        height: '30vh',
        background: `radial-gradient(ellipse, ${isDark ? 'rgba(51,136,255,0.05)' : 'rgba(46,127,223,0.04)'} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }} />
      {/* Tertiary purple — top right */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '-5%',
        width: '40vw',
        height: '25vh',
        background: `radial-gradient(ellipse, ${isDark ? 'rgba(153,102,255,0.04)' : 'rgba(124,92,219,0.03)'} 0%, transparent 70%)`,
        filter: 'blur(30px)',
      }} />
    </div>
  );
}
