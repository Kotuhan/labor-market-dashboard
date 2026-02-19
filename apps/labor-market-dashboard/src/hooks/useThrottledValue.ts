import { useEffect, useRef, useState } from 'react';

/**
 * Returns a throttled version of `value` that updates at most once per `intervalMs`.
 *
 * The first value is returned immediately. Subsequent changes are batched so
 * the returned value updates no more than once every `intervalMs` milliseconds
 * (trailing edge — the latest value is always eventually emitted).
 *
 * @param value - The source value (may change on every render)
 * @param intervalMs - Minimum interval between updates (in milliseconds)
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdateTime = useRef<number>(0);
  const timerId = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdateTime.current;

    if (elapsed >= intervalMs) {
      setThrottled(value);
      lastUpdateTime.current = now;
    } else {
      clearTimeout(timerId.current);
      timerId.current = setTimeout(() => {
        setThrottled(value);
        lastUpdateTime.current = Date.now();
      }, intervalMs - elapsed);
    }

    return () => clearTimeout(timerId.current);
  }, [value, intervalMs]);

  return throttled;
}
