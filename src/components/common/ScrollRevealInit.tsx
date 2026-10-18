'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll, [data-reveal]').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const observeElements = () => {
      // Find sections and elements configured for scroll reveal
      const selectors = [
        '.reveal-on-scroll',
        '[data-reveal]',
        '.popular-categories',
        '.section-spacer-mb',
        '.promo-feature-card',
        '.browse-cat-card-wrapper',
      ];

      const elements = document.querySelectorAll(selectors.join(', '));
      elements.forEach((el) => {
        if (!el.classList.contains('is-revealed')) {
          el.classList.add('reveal-on-scroll');
          observer.observe(el);
        }
      });
    };

    // Initial check
    observeElements();

    // Check again after dynamic renders and image loads
    const timer1 = setTimeout(observeElements, 250);
    const timer2 = setTimeout(observeElements, 800);

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  return null;
}

export default ScrollRevealInit;
