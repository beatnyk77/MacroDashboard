#!/usr/bin/env python3
"""Add default aria-labels to all IconButtons in DataHealthDashboard.tsx"""

import re

def add_aria_label(match):
    attrs = match.group(1)
    # If already has aria-label, skip
    if 'aria-label=' in attrs:
        return match.group(0)
    # Determine a simple label based on common patterns
    label = "Action"  # default

    # Check for color attribute that might hint
    color_match = re.search(r'color="(primary|success|warning|error|info)"', attrs)
    if color_match:
        # Not useful
        pass

    # If onClick mentions 'send', use "Send"
    if 'Send' in attrs:
        label = "Send"
    elif 'Refresh' in attrs or 'handleForceRefresh' in attrs:
        # Try to extract a more specific label from the surrounding context? Hard.
        label = "Refresh data"
    else:
        label = "Toggle action"

    # Insert aria-label
    if attrs.strip().endswith('/>'):
        new_attrs = attrs.rstrip('/>') + f' aria-label="{label}" />'
    else:
        new_attrs = attrs.rstrip('>') + f' aria-label="{label}">'
    return f'<IconButton{new_attrs}'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    content = re.sub(r'<IconButton([^>]*)>', add_aria_label, content)
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
