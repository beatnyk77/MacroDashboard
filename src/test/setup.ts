import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom-only setup — these globals don't exist in the node test environment
if (typeof window !== 'undefined') {
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
