import { useState } from 'react';

const FLIP_THRESHOLD = 100;
const FLIP_DURATION = 400;

export const usePageFlip = (totalPages: number) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStart === null || isFlipping) return;
    e.preventDefault();
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragOffset(currentX - dragStart);
  };

  const handleDragEnd = () => {
    if (dragStart === null || isFlipping) return;

    if (Math.abs(dragOffset) > FLIP_THRESHOLD) {
      setIsFlipping(true);
      if (dragOffset > 0 && currentPageIndex > 0) {
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex - 1);
          setDragOffset(0);
          setIsFlipping(false);
        }, FLIP_DURATION);
      } else if (dragOffset < 0 && currentPageIndex < totalPages - 1) {
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex + 1);
          setDragOffset(0);
          setIsFlipping(false);
        }, FLIP_DURATION);
      } else {
        setDragOffset(0);
        setIsFlipping(false);
      }
    } else {
      setDragOffset(0);
      setIsFlipping(false);
    }
    setDragStart(null);
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
    }
  };

  return {
    currentPageIndex,
    dragOffset,
    isFlipping,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    goToPage,
  };
};
