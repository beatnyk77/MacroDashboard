import { readFile, writeFile, rename } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

const files = await glob('src/**/*.{tsx,ts}');

for (const file of files) {
  try {
    let content = await readFile(file, 'utf-8');
    let original = content;
    
    // Replace Grid container with Tailwind grid
    content = content.replace(/<Grid\s+container/g, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"');
    
    // Replace Grid item with col-span patterns
    // xs={12} md={4} → col-span-12 md:col-span-4
    content = content.replace(/<Grid\s+item\s+xs=\{12\}\s+md=\{4\}/g, '<div className="col-span-12 md:col-span-4">');
    content = content.replace(/<Grid\s+item\s+xs=\{12\}\s+md=\{8\}/g, '<div className="col-span-12 md:col-span-8">');
    content = content.replace(/<Grid\s+item\s+xs=\{12\}\s+lg=\{4\}/g, '<div className="col-span-12 lg:col-span-4">');
    content = content.replace(/<Grid\s+item\s+xs=\{12\}\s+lg=\{6\}/g, '<div className="col-span-12 lg:col-span-6">');
    content = content.replace(/<Grid\s+item\s+xs=\{12\}\s+lg=\{8\}/g, '<div className="col-span-12 lg:col-span-8">');
    content = content.replace(/<Grid\s+item\s+xs=\{6\}/g, '<div className="col-span-6">');
    content = content.replace(/<Grid\s+item/g, '<div className="col-span-1">'); // default fallback
    
    // Replace closing Grid tags
    content = content.replace(/<\/Grid>/g, '</div>');
    
    // Remove import { Grid } from '@mui/material' if no more Grid usage
    if (content !== original) {
      await writeFile(file, content);
      console.log(`✓ Updated ${file}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${file}:`, err.message);
  }
}
