#!/usr/bin/env python3
"""
Migrate MUI Grid components to Tailwind CSS Grid.
Handles:
- Grid container → <div className="grid ...">
- Grid item → <div className="col-span-...">
- Closing Grid tags
"""

import re
import os
from pathlib import Path

# Mapping for Grid item props to Tailwind classes
GRID_ITEM_MAPPING = {
    r'<Grid\s+item\s+xs=\{12\}>': '<div className="col-span-12">',
    r'<Grid\s+item\s+xs=\{12\}\s+md=\{6\}>': '<div className="col-span-12 md:col-span-6">',
    r'<Grid\s+item\s+xs=\{12\}\s+md\{8\}>': '<div className="col-span-12 md:col-span-8">',
    r'<Grid\s+item\s+xs=\{12\}\s+lg\{4\}>': '<div className="col-span-12 lg:col-span-4">',
    r'<Grid\s+item\s+xs=\{12\}\s+lg\{6\}>': '<div className="col-span-12 lg:col-span-6">',
    r'<Grid\s+item\s+xs=\{12\}\s+lg\{8\}>': '<div className="col-span-12 lg:col-span-8">',
    r'<Grid\s+item\s+xs=\{6\}>': '<div className="col-span-6">',
    r'<Grid\s+item>': '<div className="col-span-12">',  # default full width
}

def replace_grid_patterns(content):
    """Replace MUI Grid patterns with Tailwind equivalents."""

    # Replace Grid container
    # Pattern: <Grid container spacing={N} [sx={...}]>
    # We'll capture the spacing value and optionally other props
    def container_replacer(match):
        attrs = match.group(1) if hasattr(match, 'group') else match
        # Extract spacing
        spacing_match = re.search(r'spacing=\{(\d+)\}', attrs)
        spacing = spacing_match.group(1) if spacing_match else '4'
        gap_class = f'gap-{int(spacing)*2}'  # spacing N -> gap-N*2 (since 1 = 4px, spacing N = 8px*N = (N*2)*4px)
        # Other props we ignore for now (like sx) but we could translate some
        return f'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 {gap_class}"'

    content = re.sub(r'<Grid\s+container([^>]*)>', container_replacer, content)

    # Replace Grid closing tags
    content = content.replace('</Grid>', '</div>')

    # Replace Grid items with various patterns
    for pattern, replacement in GRID_ITEM_MAPPING.items():
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)

    # Also handle Grid items without explicit xs, e.g., <Grid item> (already covered)
    # but also with extra props:
    # <Grid item xs={12} md={4} key={...}> etc. Need to allow extra props.
    # We'll do a more flexible replacement:
    content = re.sub(
        r'<Grid\s+item(?=[^>]*xs=\{12\}[^>]*md\{4\}[^>]*)',
        '<div className="col-span-12 md:col-span-4"',
        content,
        flags=re.IGNORECASE
    )
    # Add more patterns as needed

    return content

def process_file(filepath):
    """Process a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = replace_grid_patterns(original)

    if original != modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified)
        return True
    return False

def main():
    src_dir = Path('src')
    files = list(src_dir.rglob('*.tsx')) + list(src_dir.rglob('*.ts'))
    print(f"Processing {len(files)} files...")

    migrated = 0
    for filepath in files:
        try:
            if process_file(filepath):
                print(f'✓ {filepath}')
                migrated += 1
        except Exception as e:
            print(f'✗ {filepath}: {e}')

    print(f"\nMigrated {migrated} files.")

if __name__ == '__main__':
    main()
