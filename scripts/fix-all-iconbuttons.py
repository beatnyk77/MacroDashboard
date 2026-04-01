#!/usr/bin/env python3
"""
Fix all IconButtons in DataHealthDashboard.tsx:
- Add aria-label if missing
- Add aria-hidden="true" to child icons
"""

import re

def process_iconbutton(match):
    attrs = match.group(1)

    # Add aria-label if missing
    if 'aria-label=' not in attrs:
        # Use descriptive label based on function if possible
        func_match = re.search(r"handleForceRefresh\('([^']+)'\)", attrs)
        if func_match:
            func = func_match.group(1)
            # Convert function name to readable label
            label = func.replace('ingest-', '').replace('-', ' ').title()
            label = label.replace('Nse', 'NSE').replace('Us', 'US').replace('Fred', 'FRED').replace('Rbi', 'RBI').replace('Cie', 'CIE')
            label = f'Refresh {label}'
        else:
            label = 'Trigger action'
        # Insert before closing > (or />)
        if attrs.strip().endswith('/>'):
            attrs = attrs.rstrip('/>') + f' aria-label="{label}" />'
        else:
            attrs = attrs.rstrip('>') + f' aria-label="{label}">'

    # Ensure child icons have aria-hidden - this is done outside this function; we'll handle later via another sub on the whole content?
    # Actually we can modify the inner content in a second pass.
    return f'<IconButton{attrs}>'

def process_icon_children(content):
    """Add aria-hidden="true" to the immediate child element of IconButton if it's an icon component."""
    # This is tricky: we want to find inside an IconButton tags like <Send .../>, <RefreshCcw .../>, <CircularProgress .../> and add aria-hidden.
    # We can do a regex that matches inside <IconButton...>...</IconButton> but simpler: for any of these icon tags that are directly inside an IconButton, add attribute.
    # We'll search for the icon tags and if preceded by <IconButton within a few lines? Better: use a state machine? Or do a two-pass: first find IconButton blocks, then within each block add attribute to first child tag.
    content = re.sub(
        r'(<IconButton[^>]*>)\s*<(Send|RefreshCcw|CircularProgress|X|Upload)[^>]*/?>\s*(</IconButton>)',
        lambda m: f"{m.group(1)}<{m.group(2)} {m.group(2)} aria-hidden=\"true\" />{m.group(3)}",
        content,
        flags=re.DOTALL
    )
    # But careful: the icon tags might have existing props. The regex above assumes they start with <Tag and end with > or />. With `[^>]*/?>` matches up to closing >, including self-closing. But I need to preserve existing props. So I need to capture the existing tag content and then inject aria-hidden.
    # Use: <(Send|...)([^>]*?)> and then replace with <\1\2 aria-hidden="true">
    content = re.sub(
        r'(<IconButton[^>]*>)\s*<(Send|RefreshCcw|CircularProgress|X|Upload)([^>]*?)>',
        lambda m: f"{m.group(1)}<{m.group(2)}{m.group(3)} aria-hidden=\"true\">",
        content,
        flags=re.DOTALL
    )
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # First pass: add aria-label to IconButton tags
    content = re.sub(r'<IconButton([^>]*)>', process_iconbutton, content)

    # Second pass: add aria-hidden to child icons
    content = process_icon_children(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    file = 'src/pages/DataHealthDashboard.tsx'
    if process_file(file):
        print(f'Updated {file} - fixed all IconButtons')
    else:
        print(f'No changes made to {file}')
