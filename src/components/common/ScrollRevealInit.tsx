'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Immediately mark any above-the-fold or in-viewport elements as revealed so they never flash or blank out
    const revealVisibleElements = () => {
      const explicitElements = document.querySelectorAll<HTMLElement>('.reveal-on-scroll, [data-reveal]');
      const windowHeight = window.innerHeight || 800;

      explicitElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= windowHeight + 150) {
          el.classList.add('is-revealed');
        }
      });
    };

    revealVisibleElements();

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
        threshold: 0.05,
        rootMargin: '0px 0px 50px 0px',
      }
    );

    // Only observe elements that explicitly have .reveal-on-scroll or [data-reveal]
    // NEVER dynamically inject opacity: 0 onto core layout sections (.section-spacer-mb, etc.)
    const elementsToObserve = document.querySelectorAll<HTMLElement>('.reveal-on-scroll:not(.is-revealed), [data-reveal]:not(.is-revealed)');
    elementsToObserve.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}

export default ScrollRevealInit;
