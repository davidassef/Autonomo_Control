import { renderHook, act } from '@testing-library/react';
import { useDebounce, useStableObject, useThrottle, useStableArray, useWhyDidYouUpdate, withMemo } from './performance';
import React from 'react';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDebounce', () => {
    it('deve atrasar a execução da função', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebounce(mockCallback, 500));

      act(() => {
        result.current('test');
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('deve cancelar execuções anteriores', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebounce(mockCallback, 500));

      act(() => {
        result.current('first');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current('second');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('second');
    });
  });

  describe('useStableObject', () => {
    it('deve retornar o mesmo objeto quando os valores não mudam', () => {
      const obj = { a: 1, b: 2 };
      const { result, rerender } = renderHook(
        ({ obj }) => useStableObject(obj),
        { initialProps: { obj } }
      );

      const firstResult = result.current;

      rerender({ obj: { a: 1, b: 2 } });

      expect(result.current).toBe(firstResult);
    });

    it('deve retornar novo objeto quando os valores mudam', () => {
      const obj = { a: 1, b: 2 };
      const { result, rerender } = renderHook(
        ({ obj }) => useStableObject(obj),
        { initialProps: { obj } }
      );

      const firstResult = result.current;

      rerender({ obj: { a: 1, b: 3 } });

      expect(result.current).not.toBe(firstResult);
      expect(result.current).toEqual({ a: 1, b: 3 });
    });
  });

  describe('useThrottle', () => {
    it('deve executar função imediatamente na primeira chamada', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useThrottle(mockCallback, 100));

      act(() => {
        result.current('test');
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('deve retornar uma função válida', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useThrottle(mockCallback, 100));

      expect(typeof result.current).toBe('function');
    });

    it('deve funcionar com múltiplas chamadas', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useThrottle(mockCallback, 0)); // sem delay para teste

      act(() => {
        result.current('first');
        result.current('second');
      });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('useStableArray', () => {
    it('deve retornar o mesmo array quando o conteúdo não muda', () => {
      const arr = [1, 2, 3];
      const { result, rerender } = renderHook(
        ({ arr }) => useStableArray(arr),
        { initialProps: { arr } }
      );

      const firstResult = result.current;

      rerender({ arr: [1, 2, 3] });

      expect(result.current).toBe(firstResult);
    });

    it('deve retornar novo array quando o conteúdo muda', () => {
      const arr = [1, 2, 3];
      const { result, rerender } = renderHook(
        ({ arr }) => useStableArray(arr),
        { initialProps: { arr } }
      );

      const firstResult = result.current;

      rerender({ arr: [1, 2, 4] });

      expect(result.current).not.toBe(firstResult);
      expect(result.current).toEqual([1, 2, 4]);
    });
  });

  describe('useWhyDidYouUpdate', () => {
    it('deve ser uma função válida', () => {
      expect(typeof useWhyDidYouUpdate).toBe('function');
    });
  });

  describe('withMemo', () => {
    it('deve retornar um componente memoizado', () => {
      const TestComponent = ({ value }: { value: number }) => React.createElement('div', null, value);
      const MemoizedComponent = withMemo(TestComponent);

      expect(MemoizedComponent).toBeDefined();
      expect(typeof MemoizedComponent).toBe('object');
    });
  });
});