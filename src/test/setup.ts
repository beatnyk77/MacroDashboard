import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom-only setup — these globals don't exist in the node test environment
if (typeof window !== 'undefined') {
  const createStorageMock = () => {
    let store: Record<string, string> = {};

    return {
      get length() {
        return Object.keys(store).length;
      },
      clear: vi.fn(() => {
        store = {};
      }),
      getItem: vi.fn((key: string) => store[key] ?? null),
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = String(value);
      }),
    };
  };

  if (!window.localStorage) {
    const storage = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
  }

  // Mock ResizeObserver for Recharts
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock;

  // Mock matchMedia for MUI and responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock scrollIntoView for cmdk and other components using it
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}
