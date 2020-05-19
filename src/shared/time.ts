export function getUTCTime(time?: Date | number) {
  const date = new Date(time || Date.now());
  const utc = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
  return utc;
}
