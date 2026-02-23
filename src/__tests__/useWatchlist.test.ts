import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from '../hooks/useWatchlist';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('initializes with empty watchlist', () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual([]);
  });

  it('adds item to watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addToWatchlist('film-1');
    });

    expect(result.current.watchlist).toContain('film-1');
  });

  it('does not add duplicate items', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addToWatchlist('film-1');
      result.current.addToWatchlist('film-1');
    });

    expect(result.current.watchlist).toHaveLength(1);
  });

  it('removes item from watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addToWatchlist('film-1');
      result.current.addToWatchlist('film-2');
    });

    act(() => {
      result.current.removeFromWatchlist('film-1');
    });

    expect(result.current.watchlist).not.toContain('film-1');
    expect(result.current.watchlist).toContain('film-2');
  });

  it('toggles item in watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggleWatchlist('film-1');
    });
    expect(result.current.watchlist).toContain('film-1');

    act(() => {
      result.current.toggleWatchlist('film-1');
    });
    expect(result.current.watchlist).not.toContain('film-1');
  });

  it('checks if item is in watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.isInWatchlist('film-1')).toBe(false);

    act(() => {
      result.current.addToWatchlist('film-1');
    });

    expect(result.current.isInWatchlist('film-1')).toBe(true);
  });

  it('clears watchlist', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addToWatchlist('film-1');
      result.current.addToWatchlist('film-2');
    });

    act(() => {
      result.current.clearWatchlist();
    });

    expect(result.current.watchlist).toHaveLength(0);
  });

  it('sets isLoaded to true after mounting', () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.isLoaded).toBe(true);
  });
});
