import fs from 'fs';
import path from 'path';

try {
  fs.unlinkSync(path.resolve('src/pages/MacroBrief.tsx'));
  console.log('Deleted MacroBrief.tsx');
} catch (e) {
  console.error('Failed to delete MacroBrief.tsx:', e.message);
}

try {
  fs.unlinkSync(path.resolve('src/pages/MacroBriefArchive.tsx'));
  console.log('Deleted MacroBriefArchive.tsx');
} catch (e) {
  console.error('Failed to delete MacroBriefArchive.tsx:', e.message);
}
