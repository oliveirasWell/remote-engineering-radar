export const formatRelativeTime = (
  value: Date | null,
  now = new Date(),
): string => {
  if (!value) {
    return 'Unknown';
  }

  const deltaMs = now.getTime() - value.getTime();
  const minutes = Math.max(0, Math.floor(deltaMs / (1000 * 60)));
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const formatUpdatedLabel = (updatedAt: Date | null): string => {
  if (!updatedAt) {
    return 'Updated: —';
  }

  return `Updated: ${updatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`;
};
