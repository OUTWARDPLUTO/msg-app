import { useEffect, useState, useRef } from 'react';

export default function AmbientBackground() {
  const [embers, setEmbers] = useState([]);
  const bgRef = useRef(null);

  useEffect(() => {
    // Generate 12 random embers
    const generated = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      bottom: Math.random() * 20 - 10, // start slightly below screen
      size: Math.random() * 4 + 2, // 2px to 6px
      duration: Math.random() * 6 + 6, // 6s to 12s
      delay: Math.random() * 5, // 0s to 5s
      opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
    }));
    setEmbers(generated);
  }, []);

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
      transition: 'transform 0.1s linear' // Smooth out the parallax slightly
    }}>
      {/* Ambient Glow */}
      <div className="ambient-glow" />
      
      {/* Embers */}
      {embers.map(e => (
        <div
          key={e.id}
          className="ember-particle"
          style={{
            left: `${e.left}%`,
            bottom: `${e.bottom}%`,
            width: e.size,
            height: e.size,
            '--duration': `${e.duration}s`,
            '--delay': `${e.delay}s`,
            '--max-opacity': e.opacity,
          }}
        />
      ))}
    </div>
  );
}
