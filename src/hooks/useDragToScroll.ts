'use client';

import { useEffect, RefObject } from 'react';

/**
 * useDragToScroll hook
 * Enables mouse click-and-drag horizontal scrolling on any overflow container.
 * - Grab / grabbing cursor.
 * - Fluid drag tracking with smooth momentum upon release.
 * - Distinguishes between quick click (for links/buttons) and drag gestures (prevents accidental clicks).
 */
export function useDragToScroll(
  scrollRef: RefObject<HTMLElement | null>,
  options: { speedMultiplier?: number } = {}
) {
  const { speedMultiplier = 1.3 } = options;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;
    let lastX = 0;
    let velocity = 0;
    let animationFrameId: number | null = null;

    el.style.cursor = 'grab';

    const onMouseDown = (e: MouseEvent) => {
      // Only primary left button
      if (e.button !== 0) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      isDown = true;
      hasDragged = false;
      startX = e.pageX - el.getBoundingClientRect().left;
      lastX = e.pageX;
      scrollLeft = el.scrollLeft;
      velocity = 0;

      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      el.style.scrollBehavior = 'auto'; // Immediate 1:1 response during active drag
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const currentX = e.pageX - el.getBoundingClientRect().left;
      const deltaX = currentX - startX;

      if (Math.abs(deltaX) > 6) {
        hasDragged = true;
      }

      velocity = e.pageX - lastX;
      lastX = e.pageX;

      el.scrollLeft = scrollLeft - deltaX * speedMultiplier;
    };

    const stopDrag = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');

      // Momentum deceleration
      if (Math.abs(velocity) > 2) {
        let currentVelocity = velocity * 1.4;
        const momentumStep = () => {
          if (Math.abs(currentVelocity) < 0.4) {
            el.style.scrollBehavior = 'smooth';
            return;
          }
          el.scrollLeft -= currentVelocity;
          currentVelocity *= 0.92;
          animationFrameId = requestAnimationFrame(momentumStep);
        };
        animationFrameId = requestAnimationFrame(momentumStep);
      } else {
        el.style.scrollBehavior = 'smooth';
      }

      // If dragged, suppress immediate click events so child cards don't accidentally navigate
      if (hasDragged) {
        const preventClickCapture = (clickEvt: MouseEvent) => {
          clickEvt.stopPropagation();
          clickEvt.preventDefault();
          window.removeEventListener('click', preventClickCapture, true);
        };
        window.addEventListener('click', preventClickCapture, true);
        setTimeout(() => {
          window.removeEventListener('click', preventClickCapture, true);
        }, 120);
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [scrollRef, speedMultiplier]);
}
