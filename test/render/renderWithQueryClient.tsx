import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryWrapper } from '@/test/factories/queryClient';

export const renderWithQueryClient = (ui: ReactNode): RenderResult =>
  render(ui, { wrapper: createQueryWrapper() });
