import ts from 'typescript';
import fs from 'fs';

try {
  const content = fs.readFileSync('src/pages/Terminal.tsx', 'utf8');
  const sourceFile = ts.createSourceFile('src/pages/Terminal.tsx', content, ts.ScriptTarget.Latest, true);
  const diagnostics = sourceFile.parseDiagnostics || [];
  console.log("Syntax check diagnostics length:", diagnostics.length);
  diagnostics.forEach(d => {
    console.log(`Error: ${d.messageText} at position ${d.start}`);
  });
  process.exit(diagnostics.length > 0 ? 1 : 0);
} catch (e) {
  console.error("Failed to run syntax check:", e);
  process.exit(1);
}
