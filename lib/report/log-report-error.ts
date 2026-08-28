const redactConnectionStrings = (message: string): string =>
  message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted database URL]');

const errorChain = (error: unknown): string => {
  const messages: string[] = [];
  const seen = new Set<Error>();
  let current = error;

  while (
    current instanceof Error &&
    !seen.has(current) &&
    messages.length < 4
  ) {
    seen.add(current);
    messages.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }

  return messages.length > 0 ? messages.join(' <- ') : 'Unknown database error';
};

export const logReportError = (operation: string, error: unknown): void => {
  const message = errorChain(error);
  console.error(`[report] ${operation}: ${redactConnectionStrings(message)}`);
};
