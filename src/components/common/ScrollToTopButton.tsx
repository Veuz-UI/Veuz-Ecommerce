'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToTopButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Show button after scrolling down 320px
      if (scrollY > 320) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Calculate 0 - 100 progress
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (pathname && (pathname.startsWith('/privacy') || pathname.startsWith('/terms'))) {
    return null;
  }

  // SVG circular progress parameters
  const size = 46;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top of store"
      title={`Scroll to top (${Math.round(scrollProgress)}%)`}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#0f172a',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 990,
        boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.28), 0 2px 6px rgba(15, 23, 42, 0.12)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
        padding: 0,
        outline: 'none',
      }}
      className="scroll-to-top-btn"
    >
      {/* Circular Progress Ring */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
          pointerEvents: 'none',
        }}
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Progress indicator circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.15s ease',
          }}
        />
      </svg>

      {/* Up Arrow Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'relative',
          zIndex: 2,
          transition: 'transform 0.2s ease',
        }}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

export default ScrollToTopButton;
