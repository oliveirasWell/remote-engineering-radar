const redactConnectionStrings = (message: string): string =>
  message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted database URL]');

export const logReportError = (operation: string, error: unknown): void => {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : 'Unknown database error';
  console.error(`[report] ${operation}: ${redactConnectionStrings(message)}`);
};
