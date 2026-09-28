import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let originalOverflow = '';
let originalPosition = '';
let originalTop = '';
let originalWidth = '';

export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      originalOverflow = document.body.style.overflow;
      originalPosition = document.body.style.position;
      originalTop = document.body.style.top;
      originalWidth = document.body.style.width;

      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.documentElement.style.overflow = '';
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
};

