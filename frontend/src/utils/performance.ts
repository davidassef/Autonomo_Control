// React Performance Utilities para Autônomo Control
import React, { useCallback, useMemo, useRef, useEffect } from "react";

// Hook para debounce de funções (evita execuções desnecessárias)
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );

  return debouncedCallback as T;
};

// Hook para evitar re-renders desnecessários em objetos
export const useStableObject = <T extends Record<string, any>>(obj: T): T => {
  return useMemo(() => obj, [obj]);
};

// Hook para throttle de funções (limita execuções por tempo)
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T => {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay],
  );

  return throttledCallback as T;
};

// Hook para evitar re-renders com arrays
export const useStableArray = <T>(array: T[]): T[] => {
  return useMemo(() => array, [array]);
};

// Hook para detectar mudanças e logar (debug)
export const useWhyDidYouUpdate = (
  name: string,
  props: Record<string, any>,
) => {
  const previous = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log("[why-did-you-update]", name, changedProps);
      }
    }

    previous.current = props;
  });
};

// Higher-order component para memoização automática
export const withMemo = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
): React.ComponentType<T> => {
  return React.memo(Component);
};
