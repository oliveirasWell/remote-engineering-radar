import { QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { createTestQueryClient } from './createTestQueryClient';

export const createQueryWrapper = (
  queryClient = createTestQueryClient(),
): ComponentType<{ children: ReactNode }> => {
  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  QueryWrapper.displayName = 'QueryWrapper';
  return QueryWrapper;
};
