#!/usr/bin/env python3
"""
Correctly migrate MUI Grid to Tailwind CSS Grid.
This script fixes the broken script's work by properly handling:
- Proper tag closure
- Nested Grid structures
- All Grid item prop combinations
"""

import re
from pathlib import Path

def migrate_grid_content(content: str) -> str:
    """Migrate all Grid patterns in a content string."""

    # Pattern 1: <Grid container spacing={N} [other props]>
    # We need to replace the entire opening tag and later the closing tag
    # Use a state machine approach: identify Grid container blocks and replace

    # Better: process line by line, track nesting
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Check if this line contains <Grid container
        if '<Grid' in line and 'container' in line:
            # Extract spacing value
            spacing_match = re.search(r'spacing=\{(\d+)\}', line)
            spacing = spacing_match.group(1) if spacing_match else '4'
            gap_class = f'gap-{spacing}'

            # Build new div opening tag, preserving any existing className or other props
            # Remove Grid-specific props: container, spacing
            # Keep other props like sx, className, etc.
            new_attrs = re.sub(r'\s+container', '', line)  # remove container
            new_attrs = re.sub(r'\s+spacing=\{\d+\}', '', new_attrs)  # remove spacing
            # Replace <Grid with <div
            new_attrs = re.sub(r'<Grid', '<div', new_attrs)
            # Ensure it has the grid classes
            if 'className=' in new_attrs:
                # Insert grid classes into existing className
                new_attrs = re.sub(r'className="([^"]*)"', lambda m: f'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 {gap_class} {m.group(1)}"', new_attrs)
            else:
                # Add className with grid classes
                new_attrs = new_attrs.rstrip('>') + f' className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 {gap_class}">'
            new_lines.append(new_attrs)
            i += 1
            continue

        # Check for Grid item
        if re.match(r'\s*<Grid\s+item', line):
            # Determine col-span classes
            # Extract xs, md, lg props
            xs_match = re.search(r'xs=\{(\d+)\}', line)
            md_match = re.search(r'md=\{(\d+)\}', line)
            lg_match = re.search(r'lg=\{(\d+)\}', line)

            classes = []
            if xs_match:
                xs = xs_match.group(1)
                classes.append(f'col-span-{xs}')
            else:
                classes.append('col-span-12')  # default
            if md_match:
                classes.append(f'md:col-span-{md_match.group(1)}')
            if lg_match:
                classes.append(f'lg:col-span-{lg_match.group(1)}')

            # Convert <Grid item ...> to <div class="...">
            new_tag = re.sub(r'<Grid\s+item', '<div', line)
            # Add or enhance className
            if 'className=' in new_tag:
                new_tag = re.sub(r'className="([^"]*)"', lambda m: f'className="{" ".join(classes)} {m.group(1)}"', new_tag)
            else:
                new_tag = new_tag.rstrip('>') + f' className="{" ".join(classes)}">'
            new_lines.append(new_tag)
            i += 1
            continue

        # Handle closing Grid tag
        if line.strip() == '</Grid>':
            new_lines.append('</div>')
            i += 1
            continue

        # Other lines unchanged
        new_lines.append(line)
        i += 1

    return '\n'.join(new_lines)

def process_file(path: Path):
    original = path.read_text(encoding='utf-8')
    migrated = migrate_grid_content(original)
    if original != migrated:
        path.write_text(migrated, encoding='utf-8')
        return True
    return False

if __name__ == '__main__':
    files = list(Path('src').rglob('*.tsx')) + list(Path('src').rglob('*.ts'))
    migrated_count = 0
    for file in files:
        try:
            if process_file(file):
                print(f'✓ {file}')
                migrated_count += 1
        except Exception as e:
            print(f'✗ {file}: {e}')
    print(f'\nMigrated {migrated_count} files.')
