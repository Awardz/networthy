// src/components/VantaBackground.tsx
import React, { useEffect, useRef } from 'react';

interface VantaBackgroundProps {
  children: React.ReactNode;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ children }) => {
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).vantaEffect) return;

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initVanta = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js');

        if (vantaRef.current && (window as any).VANTA) {
          (window as any).vantaEffect = (window as any).VANTA.WAVES({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x001122,
            shininess: 60,
            waveHeight: 20,
            waveSpeed: 0.75,
            zoom: 0.85,
          });
        }
      } catch (err) {
        console.warn('Vanta failed to load:', err);
      }
    };

    initVanta();

    return () => {
      if ((window as any).vantaEffect) {
        (window as any).vantaEffect.destroy();
        (window as any).vantaEffect = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={vantaRef} className="fixed inset-0 -z-10" />
      <div className="fixed inset-0 -z-10 bg-black/70 pointer-events-none" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </>
  );
};

export default VantaBackground;