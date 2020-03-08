export function logError(error: any, message?: string) {
  if (message) console.error(message, error);
  else console.error(error);
}
