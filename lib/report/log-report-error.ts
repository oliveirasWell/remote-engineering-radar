const redactConnectionStrings = (message: string): string =>
  message.replaceAll(/postgres(?:ql)?:\/\/\S+/gi, '[redacted database URL]');

/** Deep enough to name the driver error behind a wrapper, short enough to log. */
const MAX_ERROR_CHAIN = 4;

/** `seen` both breaks reference cycles and counts the depth reached. */
const causeMessages = (error: unknown, seen: ReadonlySet<Error>): string[] =>
  error instanceof Error && !seen.has(error) && seen.size < MAX_ERROR_CHAIN
    ? [
        `${error.name}: ${error.message}`,
        ...causeMessages(error.cause, new Set([...seen, error])),
      ]
    : [];

const errorChain = (error: unknown): string => {
  const messages = causeMessages(error, new Set());
  return messages.length > 0 ? messages.join(' <- ') : 'Unknown database error';
};

export const logReportError = (operation: string, error: unknown): void => {
  const message = errorChain(error);
  console.error(`[report] ${operation}: ${redactConnectionStrings(message)}`);
};
