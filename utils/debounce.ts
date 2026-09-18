export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  delay: number,
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: TArgs): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}