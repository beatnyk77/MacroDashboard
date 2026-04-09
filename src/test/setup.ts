import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Polyfill fetch if needed (though vitest/jsdom usually has handles or we might use msw if we mocked)
// For this project, we are doing "real data flows" so we might need a fetch polyfill or just rely on native fetch in Node 18+
// Vitest handles this mostly nowadays but just in case:
if (!globalThis.fetch) {
  import('node-fetch').then(fetch => {
    globalThis.fetch = fetch.default as any;
    globalThis.Request = fetch.Request as any;
    globalThis.Response = fetch.Response as any;
  }).catch(() => {});
}
