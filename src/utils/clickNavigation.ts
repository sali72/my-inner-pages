export const getClickDirection = (
  e: React.MouseEvent,
): 'prev' | 'next' | null => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const ratio = x / rect.width;
  if (ratio < 0.4) return 'prev';
  if (ratio > 0.6) return 'next';
  return null;
};
