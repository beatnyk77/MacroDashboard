#!/usr/bin/env python3
"""Add aria-labels to IconButtons in DataHealthDashboard.tsx"""

import re

# Mapping of function keys to human-readable labels
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

def add_aria_label_to_iconbutton(match):
    attrs = match.group(1)
    # Check if already has aria-label
    if 'aria-label=' in attrs:
        return match.group(0)  # no change

    # Determine the appropriate label
    label = None

    # Check for handleForceRefresh with specific function
    force_refresh_match = re.search(r"onClick=\{\(\) => handleForceRefresh\('([^']+)'\)\}", attrs)
    if force_refresh_match:
        func_key = force_refresh_match.group(1)
        label = FUNCTION_LABELS.get(func_key, f'Trigger ingestion: {func_key}')

    # Check for handleForceTriggerCron with jobname (dynamic label)
    cron_match = re.search(r"onClick=\{\(\) => handleForceTriggerCron\(job\.jobname\)\}", attrs)
    if cron_match:
        # Use a dynamic JS expression
        label_attr = 'aria-label={\`Trigger manual run for ${job.jobname}\`}'
        # Insert into attrs
        if attrs.strip().endswith('/>'):
            new_attrs = attrs.rstrip('/>') + f' {label_attr} />'
        else:
            new_attrs = attrs.rstrip('>') + f' {label_attr}>'
        return f'<IconButton{new_attrs}'

    if label:
        # Insert aria-label before the closing > of the opening tag.
        if attrs.strip().endswith('/>'):
            new_attrs = attrs.rstrip('/>') + f' aria-label="{label}" />'
        else:
            new_attrs = attrs.rstrip('>') + f' aria-label="{label}">'
        return f'<IconButton{new_attrs}'

    return match.group(0)  # no change

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern to match <IconButton ...>
    # Count matches first
    matches = re.findall(r'<IconButton([^>]*)>', content)
    print(f"Found {len(matches)} IconButton tags")
    for i, m in enumerate(matches[:5]):
        print(f"Sample {i+1}: {m[:100]}...")

    content = re.sub(r'<IconButton([^>]*)>', add_aria_label_to_iconbutton, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    file = 'src/pages/DataHealthDashboard.tsx'
    if process_file(file):
        print(f'Updated {file} - added aria-labels to IconButtons')
    else:
        print(f'No changes made to {file}')
