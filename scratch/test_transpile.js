import ts from 'typescript';
import fs from 'fs';
import path from 'path';

try {
    const filePath = path.resolve('src/features/blog/blogData.ts');
    console.log('Reading file...');
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log('Transpiling...');
    const jsContent = ts.transpile(content, {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020
    });
    console.log('Running code...');
    const moduleExports = {};
    const runCode = new Function('exports', jsContent);
    runCode(moduleExports);
    console.log('Successfully retrieved blogArticles. Length:', moduleExports.blogArticles?.length);
} catch (e) {
    console.error('Failed:', e);
}
