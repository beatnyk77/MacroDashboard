/**
 * ScrollLock utility — centralizes all body scroll locking/unlocking.
 * Use this instead of directly mutating document.body.style.overflow anywhere in the app.
 *
 * Why: Direct mutations across multiple components cause scroll lock bugs
 * when components unmount without cleanup, especially in modal/overlay patterns.
 */

let lockCount = 0;

export function lockScroll(): void {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

// React hook wrapper
import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      lockScroll();
      return () => unlockScroll();
    }
  }, [isLocked]);
}
