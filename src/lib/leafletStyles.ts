let loaded = false;

export function ensureLeafletStyles(): void {
    if (loaded || typeof document === 'undefined') return;
    void import('leaflet/dist/leaflet.css');
    loaded = true;
}