import type { BoardFailure } from './types';

export const boardFailure = (board: string, error: unknown): BoardFailure => ({
  board,
  error: error instanceof Error ? error.message : String(error),
  ...(error &&
  typeof error === 'object' &&
  'status' in error &&
  typeof error.status === 'number'
    ? { status: error.status }
    : {}),
});
