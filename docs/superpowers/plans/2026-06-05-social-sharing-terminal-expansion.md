# Social Sharing + Terminal Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-card social sharing (html2canvas → watermarked PNG → share modal), remove the orphaned `/macro-observatory` route, and add DE-DOLLARIZATION & GOLD and SHADOW SYSTEM ModuleRows to the Terminal home.

**Architecture:** A `useCardCapture` hook handles DOM capture + watermark injection + cleanup. A `ShareButton` component sits absolutely inside any card wrapper and triggers the hook. A `ShareModal` displays the PNG preview with platform share links. New Terminal rows reuse existing row components (`CentralBankGoldNet`, `ShadowTradeCard`) plus two new components (`DeDollarizationPressureRow`, `GeopoliticalOSINTCard`).

**Note on spec adjustment:** The spec listed "Capital Flight Pressure" and "Shadow Trade Volume Index" as Shadow System cards — these have no backing hook data. The actual data is `ShadowTradeCard` (anomaly heatmap) and `GeopoliticalOSINTCard` (ADS-B/AIS signals). The Shadow System row uses these two instead.

**Tech Stack:** React 18, TypeScript, html2canvas, TanStack Query v5, Recharts, shadcn/ui Dialog, Tailwind CSS, lucide-react

---

## File Map

### Created
- `src/hooks/useCardCapture.ts` — html2canvas capture + watermark injection/cleanup
- `src/components/ShareButton.tsx` — hover share icon, triggers capture
- `src/components/ShareModal.tsx` — PNG preview + platform share buttons
- `src/features/dashboard/components/rows/DeDollarizationPressureRow.tsx` — COFER USD/gold/RMB share metrics + BRICS gold
- `src/features/dashboard/components/rows/GeopoliticalOSINTCard.tsx` — ADS-B/AIS signal count + feed
- `src/hooks/__tests__/useCardCapture.test.ts`
- `src/components/__tests__/ShareButton.test.tsx`
- `src/components/__tests__/ShareModal.test.tsx`

### Modified
- `src/App.tsx` — replace MacroObservatory route with `<Navigate to="/labs" replace />`; remove lazy import; add lazy imports for new row components
- `src/layout/GlobalLayout.tsx` — remove `isObservatory` check + dead `DataHealthBanner` conditional
- `src/pages/Terminal.tsx` — add DE-DOLLARIZATION & GOLD row, SHADOW SYSTEM row, ShareButton refs on existing cards

### Deleted
- `src/pages/MacroObservatory.tsx`

---

## Task 1: Install html2canvas

**Files:** none (package install only)

- [ ] **Step 1: Install the package**

```bash
npm install html2canvas
npm install --save-dev @types/html2canvas
```

Expected: `html2canvas` appears in `package.json` dependencies. TypeScript types resolve.

- [ ] **Step 2: Verify the import resolves**

```bash
npx tsc --noEmit 2>&1 | grep html2canvas
```

Expected: no output (no type errors for html2canvas).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install html2canvas for client-side card capture"
```

---

## Task 2: `useCardCapture` hook

**Files:**
- Create: `src/hooks/useCardCapture.ts`
- Create: `src/hooks/__tests__/useCardCapture.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useCardCapture.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCardCapture } from '../useCardCapture';

// Mock html2canvas
vi.mock('html2canvas', () => ({
    default: vi.fn(),
}));

import html2canvas from 'html2canvas';

const mockDataUrl = 'data:image/png;base64,abc123';
const mockBlob = new Blob(['fake'], { type: 'image/png' });

beforeEach(() => {
    const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue(mockDataUrl),
        toBlob: vi.fn().mockImplementation((cb: (b: Blob) => void) => cb(mockBlob)),
    };
    (html2canvas as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCanvas);
});

describe('useCardCapture', () => {
    it('starts with isCapturing=false and error=null', () => {
        const { result } = renderHook(() => useCardCapture());
        expect(result.current.isCapturing).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('returns dataUrl and blob on successful capture', async () => {
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);

        let captureResult: Awaited<ReturnType<typeof result.current.capture>>;
        await act(async () => {
            captureResult = await result.current.capture(el, { dataSource: 'FRED' });
        });

        expect(captureResult!.dataUrl).toBe(mockDataUrl);
        expect(captureResult!.blob).toBe(mockBlob);
        expect(result.current.isCapturing).toBe(false);
        document.body.removeChild(el);
    });

    it('removes the watermark element after capture', async () => {
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);

        await act(async () => {
            await result.current.capture(el, { dataSource: 'FRED' });
        });

        // No child elements remain after capture
        expect(el.children.length).toBe(0);
        document.body.removeChild(el);
    });

    it('sets error and re-throws on html2canvas failure', async () => {
        (html2canvas as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('canvas fail'));
        const { result } = renderHook(() => useCardCapture());
        const el = document.createElement('div');
        document.body.appendChild(el);

        await act(async () => {
            await expect(result.current.capture(el, { dataSource: 'FRED' })).rejects.toThrow('canvas fail');
        });

        expect(result.current.error).toBe('canvas fail');
        expect(result.current.isCapturing).toBe(false);
        document.body.removeChild(el);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/hooks/__tests__/useCardCapture.test.ts
```

Expected: FAIL — `Cannot find module '../useCardCapture'`

- [ ] **Step 3: Implement `useCardCapture`**

Create `src/hooks/useCardCapture.ts`:

```typescript
import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

interface CaptureResult {
    dataUrl: string;
    blob: Blob;
}

interface CaptureOptions {
    dataSource: string;
}

export function useCardCapture() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const capture = useCallback(async (el: HTMLElement, { dataSource }: CaptureOptions): Promise<CaptureResult> => {
        setIsCapturing(true);
        setError(null);

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const wm = document.createElement('div');
        wm.setAttribute('data-gq-watermark', '1');
        wm.style.cssText = [
            'position:absolute', 'bottom:0', 'left:0', 'right:0', 'height:28px',
            'background:linear-gradient(to right,rgba(2,6,23,0.95),rgba(2,6,23,0.90))',
            'display:flex', 'align-items:center', 'justify-content:space-between',
            'padding:0 12px', 'z-index:9999', 'pointer-events:none',
        ].join(';');
        wm.innerHTML = `
            <span style="color:rgba(255,255,255,0.9);font-size:10px;font-weight:700;font-family:monospace;letter-spacing:0.05em;">◆ GraphiQuestor · graphiquestor.com</span>
            <span style="color:rgba(255,255,255,0.5);font-size:10px;font-family:monospace;">${dataSource} · ${today}</span>
        `;

        const prevPosition = el.style.position;
        if (getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }
        el.appendChild(wm);

        try {
            const canvas = await html2canvas(el, {
                useCORS: true,
                allowTaint: false,
                scale: 2,
                logging: false,
            });

            const dataUrl = canvas.toDataURL('image/png');
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/png');
            });

            return { dataUrl, blob };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Capture failed';
            setError(msg);
            throw err;
        } finally {
            if (el.contains(wm)) el.removeChild(wm);
            el.style.position = prevPosition;
            setIsCapturing(false);
        }
    }, []);

    return { capture, isCapturing, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/hooks/__tests__/useCardCapture.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCardCapture.ts src/hooks/__tests__/useCardCapture.test.ts
git commit -m "feat(hooks): add useCardCapture for html2canvas card capture with watermark"
```

---

## Task 3: `ShareButton` component

**Files:**
- Create: `src/components/ShareButton.tsx`
- Create: `src/components/__tests__/ShareButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ShareButton.test.tsx`:

```typescript
import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShareButton } from '../ShareButton';

// Mock useCardCapture
const mockCapture = vi.fn();
vi.mock('@/hooks/useCardCapture', () => ({
    useCardCapture: () => ({
        capture: mockCapture,
        isCapturing: false,
        error: null,
    }),
}));

// Mock ShareModal so we can assert it opened
vi.mock('../ShareModal', () => ({
    ShareModal: ({ open, title }: { open: boolean; title: string }) =>
        open ? <div data-testid="share-modal">{title}</div> : null,
}));

describe('ShareButton', () => {
    it('renders a share button', () => {
        const ref = createRef<HTMLDivElement>();
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);
        expect(screen.getByRole('button', { name: /share this chart/i })).toBeInTheDocument();
    });

    it('calls capture with the target element on click', async () => {
        const ref = createRef<HTMLDivElement>();
        mockCapture.mockResolvedValue({ dataUrl: 'data:image/png;base64,x', blob: new Blob() });
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);

        fireEvent.click(screen.getByRole('button', { name: /share this chart/i }));

        await waitFor(() => {
            expect(mockCapture).toHaveBeenCalledWith(expect.any(HTMLElement), { dataSource: 'FRED' });
        });
    });

    it('opens ShareModal after successful capture', async () => {
        const ref = createRef<HTMLDivElement>();
        mockCapture.mockResolvedValue({ dataUrl: 'data:image/png;base64,x', blob: new Blob() });
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);

        fireEvent.click(screen.getByRole('button', { name: /share this chart/i }));

        await waitFor(() => {
            expect(screen.getByTestId('share-modal')).toBeInTheDocument();
        });
    });

    it('is disabled while capturing', () => {
        vi.mock('@/hooks/useCardCapture', () => ({
            useCardCapture: () => ({ capture: mockCapture, isCapturing: true, error: null }),
        }));
        const ref = createRef<HTMLDivElement>();
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);
        expect(screen.getByRole('button', { name: /share this chart/i })).toBeDisabled();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/ShareButton.test.tsx
```

Expected: FAIL — `Cannot find module '../ShareButton'`

- [ ] **Step 3: Implement `ShareButton`**

Create `src/components/ShareButton.tsx`:

```typescript
import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useCardCapture } from '@/hooks/useCardCapture';
import { ShareModal } from '@/components/ShareModal';

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLElement>;
    title: string;
    dataSource: string;
    href?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ targetRef, title, dataSource, href }) => {
    const { capture, isCapturing } = useCardCapture();
    const [modalOpen, setModalOpen] = useState(false);
    const [captureResult, setCaptureResult] = useState<{ dataUrl: string; blob: Blob } | null>(null);

    const shareUrl = href
        ? `https://graphiquestor.com${href}`
        : typeof window !== 'undefined'
            ? window.location.href
            : 'https://graphiquestor.com';

    const handleClick = async () => {
        if (!targetRef.current) return;
        try {
            const result = await capture(targetRef.current, { dataSource });
            setCaptureResult(result);
            setModalOpen(true);
        } catch {
            // error surfaced via isCapturing/error state in hook
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isCapturing}
                aria-label="Share this chart"
                className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/5 border border-white/10 text-white/30 opacity-0 group-hover:opacity-100 sm:opacity-30 sm:group-hover:opacity-100 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            >
                <Share2 size={14} aria-hidden="true" />
            </button>

            {captureResult && (
                <ShareModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    dataUrl={captureResult.dataUrl}
                    blob={captureResult.blob}
                    title={title}
                    href={shareUrl}
                />
            )}
        </>
    );
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/__tests__/ShareButton.test.tsx
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareButton.tsx src/components/__tests__/ShareButton.test.tsx
git commit -m "feat(ui): add ShareButton component for per-card social sharing"
```

---

## Task 4: `ShareModal` component

**Files:**
- Create: `src/components/ShareModal.tsx`
- Create: `src/components/__tests__/ShareModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ShareModal.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShareModal } from '../ShareModal';

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    dataUrl: 'data:image/png;base64,abc',
    blob: new Blob(['x'], { type: 'image/png' }),
    title: 'US Net Liquidity Proxy',
    href: 'https://graphiquestor.com/labs/us-macro-fiscal',
};

describe('ShareModal', () => {
    it('renders the PNG preview when open', () => {
        render(<ShareModal {...defaultProps} />);
        const img = screen.getByRole('img', { name: /US Net Liquidity Proxy/i });
        expect(img).toHaveAttribute('src', defaultProps.dataUrl);
    });

    it('renders all platform share links', () => {
        render(<ShareModal {...defaultProps} />);
        expect(screen.getByRole('link', { name: /X \/ Twitter/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /WhatsApp/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Download PNG/i })).toBeInTheDocument();
    });

    it('Twitter link has correct href with encoded title and url', () => {
        render(<ShareModal {...defaultProps} />);
        const link = screen.getByRole('link', { name: /X \/ Twitter/i });
        expect(link.getAttribute('href')).toContain('twitter.com/intent/tweet');
        expect(link.getAttribute('href')).toContain('US%20Net%20Liquidity%20Proxy');
    });

    it('Download link has correct filename and data URL', () => {
        render(<ShareModal {...defaultProps} />);
        const link = screen.getByRole('link', { name: /Download PNG/i });
        expect(link).toHaveAttribute('href', defaultProps.dataUrl);
        expect(link).toHaveAttribute('download', 'gq-us-net-liquidity-proxy.png');
    });

    it('Copy Link button writes to clipboard', async () => {
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        render(<ShareModal {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /Copy Link/i }));
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.href);
        });
    });

    it('does not render when open=false', () => {
        render(<ShareModal {...defaultProps} open={false} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/ShareModal.test.tsx
```

Expected: FAIL — `Cannot find module '../ShareModal'`

- [ ] **Step 3: Implement `ShareModal`**

Create `src/components/ShareModal.tsx`:

```typescript
import React, { useState } from 'react';
import { Twitter, Linkedin, Download, Link2, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    dataUrl: string;
    blob: Blob;
    title: string;
    href: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, dataUrl, title, href }) => {
    const [copied, setCopied] = useState(false);

    const shareText = encodeURIComponent(`"${title}" — institutional macro intelligence via GraphiQuestor`);
    const shareUrl = encodeURIComponent(href);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const platforms = [
        {
            label: 'X / Twitter',
            icon: <Twitter size={16} aria-hidden="true" />,
            href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
        },
        {
            label: 'LinkedIn',
            icon: <Linkedin size={16} aria-hidden="true" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
        },
        {
            label: 'WhatsApp',
            icon: <MessageCircle size={16} aria-hidden="true" />,
            href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
        },
    ];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg bg-slate-950 border-white/12 text-white">
                <DialogHeader>
                    <DialogTitle className="text-sm font-black uppercase tracking-widest">Share Chart</DialogTitle>
                </DialogHeader>

                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img src={dataUrl} alt={title} className="w-full object-contain max-h-64" />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {platforms.map(p => (
                        <a
                            key={p.label}
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                        >
                            {p.icon}
                            {p.label}
                        </a>
                    ))}

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                        <Link2 size={16} aria-hidden="true" />
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <a
                        href={dataUrl}
                        download={`gq-${slug}.png`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                        <Download size={16} aria-hidden="true" />
                        Download PNG
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/__tests__/ShareModal.test.tsx
```

Expected: 6 tests PASS

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: all tests PASS including existing tests

- [ ] **Step 6: Commit**

```bash
git add src/components/ShareModal.tsx src/components/__tests__/ShareModal.test.tsx
git commit -m "feat(ui): add ShareModal with Twitter, LinkedIn, WhatsApp, copy link, and download"
```

---

## Task 5: Wire ShareButton into 3 existing Terminal cards (validation pass)

**Files:**
- Modify: `src/pages/Terminal.tsx`

This task validates that html2canvas captures the real chart cards correctly before we roll out further. We add `ShareButton` to three cards: US Net Liquidity Proxy, Fed Monetization Monitor, and US Debt Maturity Wall.

- [ ] **Step 1: Add imports to Terminal.tsx**

At the top of `src/pages/Terminal.tsx`, add after the existing imports:

```typescript
import { useRef } from 'react';
import { ShareButton } from '@/components/ShareButton';
```

- [ ] **Step 2: Wire ShareButton into the Net Liquidity card**

In `Terminal.tsx`, find the "US Net Liquidity Proxy" card (around line 142). Wrap it with a ref div and add `ShareButton`:

```typescript
// Before the existing Card for Net Liquidity, add:
const netLiquidityRef = useRef<HTMLDivElement>(null);

// Then replace the Card opening:
// FROM:
<Card variant="elevated">

// TO:
<div ref={netLiquidityRef} className="relative group">
<Card variant="elevated">
```

And add before `</Card>` closes its `<CardHeader>`:

```typescript
<ShareButton
    targetRef={netLiquidityRef}
    title="US Net Liquidity Proxy"
    dataSource="FRED / Treasury"
    href="/labs/us-macro-fiscal"
/>
```

Close the wrapper div after `</Card>`:
```typescript
</Card>
</div>
```

- [ ] **Step 3: Wire ShareButton into the Fed Monetization card**

Find the "Fed Monetization Monitor" card (around line 165). Same pattern:

```typescript
const fedMonetizationRef = useRef<HTMLDivElement>(null);

// Wrap:
<div ref={fedMonetizationRef} className="relative group">
<Card variant="elevated">
    <CardHeader ...>
        <CardTitle ...>Fed Monetization Monitor</CardTitle>
        ...
        <ShareButton
            targetRef={fedMonetizationRef}
            title="Fed Monetization Monitor"
            dataSource="FRED"
            href="/labs/us-macro-fiscal"
        />
    </CardHeader>
    ...
</Card>
</div>
```

- [ ] **Step 4: Wire ShareButton into the US Debt Maturity Wall card**

Find the "US Debt Maturity Wall" card (around line 205). Same pattern:

```typescript
const usDebtRef = useRef<HTMLDivElement>(null);

<div ref={usDebtRef} className="relative group">
<Card variant="elevated">
    <CardHeader ...>
        <CardTitle>US Debt Maturity Wall</CardTitle>
        ...
        <ShareButton
            targetRef={usDebtRef}
            title="US Debt Maturity Wall"
            dataSource="Treasury"
            href="/labs/us-macro-fiscal"
        />
    </CardHeader>
    ...
</Card>
</div>
```

- [ ] **Step 5: TypeScript check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Start dev server and manually validate**

```bash
npm run dev
```

Open `http://localhost:5173`. Hover over the US Net Liquidity Proxy card — the share icon should appear top-right. Click it. Verify:
- Loading state appears briefly
- ShareModal opens with a PNG preview of the card (watermarked at bottom)
- Twitter, LinkedIn, WhatsApp links open correct URLs in new tab
- Download saves `gq-us-net-liquidity-proxy.png`
- Copy Link copies the URL to clipboard

Repeat for Fed Monetization Monitor and US Debt Maturity Wall cards.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Terminal.tsx
git commit -m "feat(terminal): wire ShareButton into Net Liquidity, Fed Monetization, and Debt Maturity Wall cards"
```

---

## Task 6: Remove MacroObservatory

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/layout/GlobalLayout.tsx`
- Delete: `src/pages/MacroObservatory.tsx`

- [ ] **Step 1: Update App.tsx — remove lazy import and replace route**

In `src/App.tsx`:

Remove this line:
```typescript
const MacroObservatory = lazy(() => import('@/pages/MacroObservatory').then(module => ({ default: module.MacroObservatory })));
```

Replace the route:
```typescript
// FROM:
<Route path="/macro-observatory" element={<MacroObservatory />} />

// TO:
<Route path="/macro-observatory" element={<Navigate to="/labs" replace />} />
```

(The `Navigate` import is already present in App.tsx.)

- [ ] **Step 2: Clean GlobalLayout.tsx**

In `src/layout/GlobalLayout.tsx`, remove:
```typescript
// Line 49 — remove this:
const isObservatory = location.pathname.includes('/macro-observatory');
```

And remove the conditional banner (line 93):
```typescript
// Remove this line:
{isObservatory && !isEmbedded && <DataHealthBanner />}
```

Also remove the `DataHealthBanner` import if it's no longer used anywhere else in GlobalLayout:
```typescript
// Check if DataHealthBanner is imported and remove if unused:
import { DataHealthBanner } from '@/components/DataHealthBanner';
```

- [ ] **Step 3: Delete the file**

```bash
rm src/pages/MacroObservatory.tsx
```

- [ ] **Step 4: TypeScript and lint check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors. If `DataHealthBanner` import caused an unused-import lint error, it was correctly removed in Step 2.

- [ ] **Step 5: Verify the redirect**

```bash
npm run dev
```

Navigate to `http://localhost:5173/macro-observatory`. Verify it redirects to `/labs`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/layout/GlobalLayout.tsx
git rm src/pages/MacroObservatory.tsx
git commit -m "refactor: remove orphaned /macro-observatory route, redirect to /labs"
```

---

## Task 7: `DeDollarizationPressureRow` component

**Files:**
- Create: `src/features/dashboard/components/rows/DeDollarizationPressureRow.tsx`

This component uses `useDeDollarization` (which uses `useSuspenseQuery`) and `useBricsTracker`. It must be wrapped in `<Suspense>` by the caller.

- [ ] **Step 1: Create the component**

Create `src/features/dashboard/components/rows/DeDollarizationPressureRow.tsx`:

```typescript
import React, { Suspense } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useDeDollarization } from '@/hooks/useDeDollarization';
import { useBricsTracker } from '@/hooks/useBricsTracker';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

const DeDollarizationPressureInner: React.FC = () => {
    const { data } = useDeDollarization();
    const { data: brics } = useBricsTracker();

    const metrics = [
        {
            label: 'USD Global Reserve Share',
            value: data.usdShare?.value != null ? `${data.usdShare.value.toFixed(1)}%` : 'N/A',
            delta: data.usdShare?.delta_yoy_pct ?? null,
            staleness: data.usdShare?.staleness_flag,
            invertSignal: true,
        },
        {
            label: 'Gold Reserve Share',
            value: data.goldShare?.value != null ? `${data.goldShare.value.toFixed(1)}%` : 'N/A',
            delta: data.goldShare?.delta_yoy_pct ?? null,
            staleness: data.goldShare?.staleness_flag,
            invertSignal: false,
        },
        {
            label: 'RMB Reserve Share',
            value: data.rmbShare?.value != null ? `${data.rmbShare.value.toFixed(1)}%` : 'N/A',
            delta: data.rmbShare?.delta_yoy_pct ?? null,
            staleness: data.rmbShare?.staleness_flag,
            invertSignal: false,
        },
    ];

    const bricsGoldMetric = brics?.metrics?.find(m => m.metric_id?.includes('GOLD'));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map(m => {
                    const isRising = m.delta != null && m.delta > 0;
                    const isPositiveSignal = m.invertSignal ? !isRising : isRising;
                    return (
                        <div key={m.label} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-2">{m.label}</p>
                            <p className="text-2xl font-black text-white font-mono">{m.value}</p>
                            {m.delta != null && (
                                <div className={cn(
                                    'flex items-center gap-1 mt-1 text-xs font-bold',
                                    isPositiveSignal ? 'text-amber-400' : 'text-emerald-400'
                                )}>
                                    {isRising ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    <span>{m.delta > 0 ? '+' : ''}{m.delta.toFixed(1)}% YoY</span>
                                </div>
                            )}
                            {m.staleness && (
                                <div className="mt-2">
                                    <FreshnessChip status={m.staleness} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground/50 pt-2 border-t border-white/5">
                {bricsGoldMetric ? (
                    <span className="font-mono uppercase tracking-widest">
                        BRICS Gold Accumulation:{' '}
                        <span className="text-amber-400 font-bold">{bricsGoldMetric.value?.toLocaleString()}t</span>
                    </span>
                ) : (
                    <span />
                )}
                <DataProvenanceBadge
                    source="IMF COFER"
                    methodology="Reserve Composition"
                    lastVerified={data.usdShare?.as_of_date ? new Date(data.usdShare.as_of_date) : new Date()}
                    size="sm"
                />
            </div>
        </div>
    );
};

export const DeDollarizationPressureRow: React.FC = () => (
    <Suspense fallback={<div className="h-32 animate-pulse bg-white/5 rounded-lg" />}>
        <DeDollarizationPressureInner />
    </Suspense>
);
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep DeDollarization
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/rows/DeDollarizationPressureRow.tsx
git commit -m "feat(dashboard): add DeDollarizationPressureRow with COFER USD/gold/RMB share metrics"
```

---

## Task 8: Add DE-DOLLARIZATION & GOLD ModuleRow to Terminal

**Files:**
- Modify: `src/pages/Terminal.tsx`

- [ ] **Step 1: Add lazy imports**

In `src/pages/Terminal.tsx`, add to the lazy imports section:

```typescript
const CentralBankGoldNet = lazy(() =>
    import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet }))
);
const DeDollarizationPressureRow = lazy(() =>
    import('@/features/dashboard/components/rows/DeDollarizationPressureRow').then(m => ({ default: m.DeDollarizationPressureRow }))
);
```

- [ ] **Step 2: Add refs**

In the `Terminal` component function body, add two refs alongside the existing ones:

```typescript
const cbGoldRef = useRef<HTMLDivElement>(null);
const deDolRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Insert the new ModuleRow**

In `Terminal.tsx`, after the `{/* Row 5: TRADE INTELLIGENCE */}` ModuleRow and before `{/* Row 6: INDIA MACRO */}`, insert:

```typescript
{/* Row 5.5: DE-DOLLARIZATION & GOLD */}
<ModuleRow label="DE-DOLLARIZATION & GOLD" href="/labs/de-dollarization-gold" labelColor="text-amber-500/80">
    <SectionErrorBoundary name="Central Bank Gold Net Purchases">
        <Suspense fallback={<LoadingFallback />}>
            <div ref={cbGoldRef} className="relative group">
                <ShareButton
                    targetRef={cbGoldRef}
                    title="Central Bank Gold Net Purchases"
                    dataSource="IMF COFER / WGC"
                    href="/labs/de-dollarization-gold"
                />
                <Card variant="elevated">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                        <div>
                            <CardTitle className="text-sm uppercase">Central Bank Gold Net Purchases</CardTitle>
                            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">Multi-Period Accumulation · IMF IFS / WGC</p>
                        </div>
                        <LiveStatusIndicator source="IMF COFER / WGC" />
                    </CardHeader>
                    <CardContent>
                        <CentralBankGoldNet />
                    </CardContent>
                </Card>
            </div>
        </Suspense>
    </SectionErrorBoundary>

    <SectionErrorBoundary name="De-Dollarization Pressure">
        <Suspense fallback={<LoadingFallback />}>
            <div ref={deDolRef} className="relative group">
                <ShareButton
                    targetRef={deDolRef}
                    title="De-Dollarization Pressure"
                    dataSource="IMF COFER"
                    href="/labs/de-dollarization-gold"
                />
                <Card variant="elevated">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                        <div>
                            <CardTitle className="text-sm uppercase">De-Dollarization Pressure</CardTitle>
                            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">COFER Reserve Composition · BRICS Gold Accumulation</p>
                        </div>
                        <LiveStatusIndicator source="IMF COFER" />
                    </CardHeader>
                    <CardContent>
                        <DeDollarizationPressureRow />
                    </CardContent>
                </Card>
            </div>
        </Suspense>
    </SectionErrorBoundary>
</ModuleRow>
```

- [ ] **Step 4: Lint and TypeScript check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Start dev server and verify the row renders**

```bash
npm run dev
```

Scroll to the DE-DOLLARIZATION & GOLD section. Verify:
- Both cards render with real data (or graceful loading/error states)
- Share icon appears on hover for each card
- Clicking share opens the modal with a PNG of that specific card

- [ ] **Step 6: Commit**

```bash
git add src/pages/Terminal.tsx
git commit -m "feat(terminal): add DE-DOLLARIZATION & GOLD ModuleRow with CB Gold and COFER pressure cards"
```

---

## Task 9: `GeopoliticalOSINTCard` component

**Files:**
- Create: `src/features/dashboard/components/rows/GeopoliticalOSINTCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/dashboard/components/rows/GeopoliticalOSINTCard.tsx`:

```typescript
import React from 'react';
import { Plane, Ship, Loader2 } from 'lucide-react';
import { useGeopoliticalOSINT, GeopoliticalOSINT } from '@/hooks/useGeopoliticalOSINT';
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';

const TypeIcon: React.FC<{ type: GeopoliticalOSINT['type'] }> = ({ type }) =>
    type === 'jet'
        ? <Plane size={12} className="text-blue-400 mt-0.5 shrink-0" />
        : <Ship size={12} className="text-cyan-400 mt-0.5 shrink-0" />;

export const GeopoliticalOSINTCard: React.FC = () => {
    const { data: signals, isLoading } = useGeopoliticalOSINT();

    const jetCount = signals?.filter(s => s.type === 'jet').length ?? 0;
    const vesselCount = signals?.filter(s => s.type === 'vessel').length ?? 0;
    const recent = signals?.slice(0, 5) ?? [];

    if (isLoading) {
        return (
            <div className="h-40 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Signal counts */}
            <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <Plane size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Aircraft</span>
                    <span className="text-lg font-black text-white font-mono">{jetCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <Ship size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Vessels</span>
                    <span className="text-lg font-black text-white font-mono">{vesselCount}</span>
                </div>
                <div className="ml-auto">
                    <LiveStatusIndicator source="ADS-B / AIS" />
                </div>
            </div>

            {/* Recent signal feed */}
            <div className="space-y-1">
                {recent.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40 font-mono uppercase px-3 py-4 text-center">No signals in current window</p>
                ) : (
                    recent.map(s => (
                        <div key={s.id} className="flex items-start gap-2 px-3 py-2 rounded-md bg-white/[0.02] border border-white/5">
                            <TypeIcon type={s.type} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-white/80 font-mono truncate">
                                    {s.callsign} · {s.owner_flag}
                                </p>
                                <p className="text-[10px] text-muted-foreground/50 truncate">{s.macro_correlation}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-muted-foreground/30 font-mono">
                                {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <p className="text-[10px] text-muted-foreground/30 font-mono uppercase tracking-widest">
                Source: ADS-B / AIS Surveillance · Refresh: 60s
            </p>
        </div>
    );
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep GeopoliticalOSINT
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/rows/GeopoliticalOSINTCard.tsx
git commit -m "feat(dashboard): add GeopoliticalOSINTCard with ADS-B/AIS signal feed"
```

---

## Task 10: Add SHADOW SYSTEM ModuleRow to Terminal

**Files:**
- Modify: `src/pages/Terminal.tsx`

- [ ] **Step 1: Add lazy imports**

In `src/pages/Terminal.tsx`, add:

```typescript
const ShadowTradeCard = lazy(() =>
    import('@/features/dashboard/components/rows/ShadowTradeCard').then(m => ({ default: m.ShadowTradeCard }))
);
const GeopoliticalOSINTCard = lazy(() =>
    import('@/features/dashboard/components/rows/GeopoliticalOSINTCard').then(m => ({ default: m.GeopoliticalOSINTCard }))
);
```

- [ ] **Step 2: Add refs**

In the `Terminal` component function body:

```typescript
const shadowTradeRef = useRef<HTMLDivElement>(null);
const osintRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Insert the new ModuleRow**

After `{/* Row 9: SOVEREIGN COMPASS */}` ModuleRow, append:

```typescript
{/* Row 10: SHADOW SYSTEM */}
<ModuleRow label="SHADOW SYSTEM" href="/labs/shadow-system" labelColor="text-zinc-400/80" alternateBg>
    <SectionErrorBoundary name="Shadow Trade Anomaly Matrix">
        <Suspense fallback={<LoadingFallback />}>
            <div ref={shadowTradeRef} className="relative group">
                <ShareButton
                    targetRef={shadowTradeRef}
                    title="Shadow Trade & Sanctions Evasion Monitor"
                    dataSource="UN Comtrade / Shadow Trade"
                    href="/labs/shadow-system"
                />
                <ShadowTradeCard />
            </div>
        </Suspense>
    </SectionErrorBoundary>

    <SectionErrorBoundary name="Geopolitical OSINT Feed">
        <Suspense fallback={<LoadingFallback />}>
            <div ref={osintRef} className="relative group">
                <ShareButton
                    targetRef={osintRef}
                    title="Geopolitical OSINT Signal Feed"
                    dataSource="ADS-B / AIS"
                    href="/labs/shadow-system"
                />
                <Card variant="elevated">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                        <div>
                            <CardTitle className="text-sm uppercase">Geopolitical OSINT Signal Feed</CardTitle>
                            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">ADS-B Aircraft · AIS Vessel Surveillance · Macro-Correlated</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <GeopoliticalOSINTCard />
                    </CardContent>
                </Card>
            </div>
        </Suspense>
    </SectionErrorBoundary>

    <div className="flex justify-end pt-2">
        <a href="/labs/shadow-system" className="text-xs text-zinc-400/50 hover:text-zinc-400 transition-colors font-mono uppercase tracking-widest">
            Enter Shadow System Lab →
        </a>
    </div>
</ModuleRow>
```

- [ ] **Step 4: Lint and TypeScript check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Start dev server and verify**

```bash
npm run dev
```

Scroll to the bottom of the Terminal home. Verify SHADOW SYSTEM row renders with:
- Shadow Trade anomaly heatmap card
- Geopolitical OSINT feed card
- "Enter Shadow System Lab →" link

Hover each card to confirm ShareButton appears and capture works.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Terminal.tsx
git commit -m "feat(terminal): add SHADOW SYSTEM ModuleRow with trade anomaly matrix and OSINT feed"
```

---

## Task 11: Roll out ShareButton to remaining Terminal cards

**Files:**
- Modify: `src/pages/Terminal.tsx`

Add `ShareButton` to all remaining card wrappers that don't have it yet. Use the same `ref + className="relative group"` wrapper pattern established in Task 5.

- [ ] **Step 1: Add refs for remaining cards**

In `Terminal.tsx` function body, add:

```typescript
const corpDebtRef = useRef<HTMLDivElement>(null);
const treasurySnapshotRef = useRef<HTMLDivElement>(null);
const treasuryDemandRef = useRef<HTMLDivElement>(null);
const energyRef = useRef<HTMLDivElement>(null);
const indiaRef = useRef<HTMLDivElement>(null);
const indiaCreditRef = useRef<HTMLDivElement>(null);
const chinaRef = useRef<HTMLDivElement>(null);
const africaRef = useRef<HTMLDivElement>(null);
const sovereignRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Wrap CorporateDebtMaturityWall**

Find `<CorporateDebtMaturityWall />` and wrap:

```typescript
<div ref={corpDebtRef} className="relative group">
    <ShareButton
        targetRef={corpDebtRef}
        title="Corporate Debt Maturity Wall"
        dataSource="FRED / EDGAR"
        href="/labs/us-macro-fiscal"
    />
    <CorporateDebtMaturityWall />
</div>
```

- [ ] **Step 3: Wrap TreasurySnapshotSection**

Find the Card containing `<TreasurySnapshotSection />`:

```typescript
<div ref={treasurySnapshotRef} className="relative group">
    <ShareButton
        targetRef={treasurySnapshotRef}
        title="Treasury Snapshot"
        dataSource="Treasury / FRED"
        href="/labs/us-macro-fiscal"
    />
    <Card variant="elevated">
        <CardContent>
            <TreasurySnapshotSection />
        </CardContent>
    </Card>
</div>
```

- [ ] **Step 4: Wrap USTreasuryDemandGauge card**

Find the Card containing `<USTreasuryDemandGauge />`:

```typescript
<div ref={treasuryDemandRef} className="relative group">
    <ShareButton
        targetRef={treasuryDemandRef}
        title="Auction Demand Gauge"
        dataSource="FRED / Treasury"
        href="/labs/us-macro-fiscal"
    />
    <Card variant="elevated">...</Card>
</div>
```

- [ ] **Step 5: Wrap EnergySection**

Find `<EnergySection />` and wrap:

```typescript
<div ref={energyRef} className="relative group">
    <ShareButton
        targetRef={energyRef}
        title="Energy Markets"
        dataSource="EIA / IEA"
        href="/labs/energy-commodities"
    />
    <EnergySection />
</div>
```

- [ ] **Step 6: Wrap IndiaMacroDashboard and IndiaCreditCycleClock**

```typescript
<div ref={indiaRef} className="relative group">
    <ShareButton targetRef={indiaRef} title="India Macro Dashboard" dataSource="RBI / MoSPI" href="/intel/india" />
    <IndiaMacroDashboard />
</div>

<div ref={indiaCreditRef} className="relative group">
    <ShareButton targetRef={indiaCreditRef} title="India Credit Cycle Clock" dataSource="RBI" href="/methods/india-credit-cycle-clock" />
    <IndiaCreditCycleClock />
</div>
```

- [ ] **Step 7: Wrap ChinaMacroPulseSection**

```typescript
<div ref={chinaRef} className="relative group">
    <ShareButton targetRef={chinaRef} title="China Macro Pulse" dataSource="NBS / PBoC" href="/intel/china" />
    <Card variant="elevated">
        <CardContent>
            <ChinaMacroPulseSection />
        </CardContent>
    </Card>
</div>
```

- [ ] **Step 8: Wrap AfricaMacroSnapshot**

```typescript
<div ref={africaRef} className="relative group">
    <ShareButton targetRef={africaRef} title="Africa Macro Snapshot" dataSource="IMF / World Bank" href="/labs/africa-macro" />
    <AfricaMacroSnapshot />
</div>
```

- [ ] **Step 9: Wrap SovereignRiskMatrix**

```typescript
<div ref={sovereignRef} className="relative group">
    <ShareButton targetRef={sovereignRef} title="Sovereign Risk Matrix" dataSource="IMF / BIS" href="/labs/sovereign-stress" />
    <SovereignRiskMatrix />
</div>
```

- [ ] **Step 10: Final lint and TypeScript check**

```bash
npm run lint
npx tsc --noEmit
npm run test
```

Expected: all passing

- [ ] **Step 11: Start dev server and do a full scroll-through**

```bash
npm run dev
```

Scroll the entire Terminal home from top to bottom. Every data card should show a share icon on hover. Click 2–3 random ones and confirm the modal opens with a correct watermarked PNG.

- [ ] **Step 12: Final commit**

```bash
git add src/pages/Terminal.tsx
git commit -m "feat(terminal): roll out ShareButton to all remaining Terminal home cards"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Per-card share button (hover, top-right) — Tasks 3, 5, 11
- [x] html2canvas capture + watermark — Task 2
- [x] Share modal with Twitter, LinkedIn, WhatsApp, Copy Link, Download — Task 4
- [x] MacroObservatory redirect to /labs — Task 6
- [x] DE-DOLLARIZATION & GOLD row (CentralBankGoldNet + DeDollarizationPressureRow) — Tasks 7, 8
- [x] SHADOW SYSTEM row (ShadowTradeCard + GeopoliticalOSINTCard) — Tasks 9, 10
- [x] Each card in a separate full-width row — verified in Tasks 8, 10

**Type consistency:**
- `useCardCapture` returns `{ capture, isCapturing, error }` — used identically in `ShareButton`
- `ShareModal` props (`open`, `onClose`, `dataUrl`, `blob`, `title`, `href`) — passed identically from `ShareButton`
- `DeDollarizationPressureRow` exports `DeDollarizationPressureRow` (named) — lazy imported by name in Task 8
- `GeopoliticalOSINTCard` exports `GeopoliticalOSINTCard` (named) — lazy imported by name in Task 10
- `CentralBankGoldNet` exports `CentralBankGoldNet` (named, confirmed from existing file) — lazy imported by name in Task 8
- `ShadowTradeCard` exports `ShadowTradeCard` (named, confirmed from existing file) — lazy imported by name in Task 10
