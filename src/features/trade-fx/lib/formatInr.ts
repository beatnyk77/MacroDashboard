/** Formats INR amounts using Indian lakh/crore conventions. */
export function formatInrIndian(amount: number, showSign = true): string {
    const sign =
        showSign && amount > 0 ? '+' : showSign && amount < 0 ? '−' : '';
    const abs = Math.abs(amount);

    if (abs >= 1e7) {
        return `${sign}₹${(abs / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    }
    if (abs >= 1e5) {
        return `${sign}₹${(abs / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
    }

    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(abs);

    return `${sign}${formatted}`;
}

export function describeInrMove(deltaRatePct: number): string {
    if (deltaRatePct > 0) return 'INR depreciates';
    if (deltaRatePct < 0) return 'INR appreciates';
    return 'INR unchanged';
}