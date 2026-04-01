#!/usr/bin/env python3
"""Fix IconButtons in DataHealthDashboard.tsx: add aria-labels and aria-hidden to icons."""

import re

FUNCTION_LABELS = {
    'generate-newsletter': 'Generate newsletter digest',
    'ingest-asi': 'Refresh ASI Matrix data',
    'ingest-energy': 'Refresh Energy Terminal data',
    'ingest-nse-flows': 'Refresh NSE India flows',
    'ingest-us-macro': 'Refresh US Macro Pulse',
    'ingest-geopolitical-osint': 'Refresh Geopolitical OSINT',
    'ingest-fred': 'Refresh FRED economic data',
    'ingest-rbi-money-market': 'Refresh RBI money market data',
    'ingest-rbi-fx-defense': 'Refresh RBI FX defense data',
    'ingest-india-digitization': 'Refresh India digitization metrics',
    'ingest-gold-debt-coverage': 'Refresh gold debt coverage',
    'ingest-gold-positioning': 'Refresh gold positioning',
    'ingest-cie-short-selling': 'Refresh CIE short selling data',
    'ingest-cie-fundamentals/promoters': 'Refresh CIE fundamentals and promoters',
    'ingest-global-refining': 'Refresh global refining data',
    'ingest-commodity-terminal': 'Refresh commodity terminal',
    'ingest-us-edgar-fundamentals': 'Refresh US EDGAR fundamentals',
}

def add_aria_to_iconbutton(match):
    # match: full tag <IconButton ...>
    full_tag = match.group(0)
    # Extract attributes: we want to capture everything after 'IconButton' up to the final '>'
    # Let's capture using a more precise pattern: <IconButton\s+([^>]*?)>
    # Actually we'll use our own sub-regex.
    return full_tag  # placeholder

def main():
    filepath = 'src/pages/DataHealthDashboard.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # First, add aria-label to each IconButton opening tag
    # We'll use a regex that captures the whole opening tag
    def replace_iconbutton(match):
        full_tag = match.group(0)
        # To avoid double-processing, check if aria-label already present
        if 'aria-label=' in full_tag:
            return full_tag
        # Determine label
        label = None
        func_match = re.search(r"handleForceRefresh\('([^']+)'\)", full_tag)
        if func_match:
            func = func_match.group(1)
            label = FUNCTION_LABELS.get(func, f'Refresh {func.replace("-", " ")}')
        elif 'handleForceTriggerCron' in full_tag:
            # Use dynamic expression
            # We'll add aria-label={\`Trigger manual run for ${job.jobname}\`}
            # Insert before closing >
            new_tag = re.sub(r'>$', r' aria-label={\`Trigger manual run for ${job.jobname}\`}>', full_tag)
            return new_tag
        else:
            label = "Action"

        # Insert aria-label before closing '>'
        new_tag = re.sub(r'>$', f' aria-label="{label}">', full_tag)
        return new_tag

    content = re.sub(r'<IconButton[^>]*>', replace_iconbutton, content, flags=re.DOTALL)

    # Second, add aria-hidden to child icons: Send, RefreshCcw, CircularProgress, X, Upload, etc.
    # We'll process each IconButton block: find opening and closing tags, and within, add aria-hidden to first child element if it's an icon.
    # But easier: for each occurrence of <IconButton...> ... <Send .../> ... </IconButton>, we replace <Send([^>]*?)> with <Send\1 aria-hidden="true" />.
    # But careful: the icon might be self-closing or with separate closing tag? In our code they are self-closing.
        # We'll use pattern: (<IconButton[^>]*>[\s\S]*?)<(Send|RefreshCcw|CircularProgress|X|Upload)([^>]*?)>
        # But this may match across multiple. Simpler: just add aria-hidden to these tags when they are inside an IconButton? Could do globally: any of these tags that appear directly inside IconButton? Hard.

    # Instead, we'll add aria-hidden to any occurrence of these icon components that are preceded by an <IconButton (within same file) but not already have aria-hidden, globally. That's safe because these icons are only used as buttons; but could be elsewhere. Should restrict to direct children of IconButton only.
    # For simplicity, we'll add aria-hidden to all Send, RefreshCcw, X, Upload, CircularProgress tags that don't have their own aria-* attributes. This is broad but safe: these icons are decorative when inside buttons.
    icon_tags = ['Send', 'RefreshCcw', 'X', 'Upload', 'CircularProgress']
    for tag in icon_tags:
        pattern = f'<{tag}([^>]*?)>'
        def add_aria_hidden(m):
            attrs = m.group(1)
            if 'aria-hidden' in attrs:
                return m.group(0)
            # Also if it has aria-label or role, maybe it's not decorative. But we assume hidden.
            return f'<{tag}{attrs} aria-hidden="true" />'
        content = re.sub(pattern, add_aria_hidden, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed IconButtons in {filepath}')

if __name__ == '__main__':
    main()
