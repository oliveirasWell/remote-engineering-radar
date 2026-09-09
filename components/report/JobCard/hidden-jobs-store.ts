'use client';

import {
  HIDDEN_JOBS_CHANGE_EVENT,
  HIDDEN_JOBS_STORAGE_KEY,
} from '../constants';

const readHiddenJobIds = (): string[] => {
  try {
    const storedValue = localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY);
    const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (jobId): jobId is string => typeof jobId === 'string',
        )
      : [];
  } catch {
    return [];
  }
};

export const hiddenJobsStore = {
  has: (jobId: string): boolean => readHiddenJobIds().includes(jobId),
  hide: (jobId: string): void => {
    const hiddenJobIds = [...new Set([...readHiddenJobIds(), jobId])];

    localStorage.setItem(HIDDEN_JOBS_STORAGE_KEY, JSON.stringify(hiddenJobIds));
    window.dispatchEvent(new Event(HIDDEN_JOBS_CHANGE_EVENT));
  },
  subscribe: (onStoreChange: () => void): (() => void) => {
    window.addEventListener(HIDDEN_JOBS_CHANGE_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);

    return () => {
      window.removeEventListener(HIDDEN_JOBS_CHANGE_EVENT, onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  },
};
