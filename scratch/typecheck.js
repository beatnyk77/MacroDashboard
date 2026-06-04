import ts from 'typescript';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('tsconfig.json');
const parsed = ts.readConfigFile(configPath, ts.sys.readFile);

if (parsed.error) {
  console.error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(
  parsed.config,
  ts.sys,
  path.dirname(configPath)
);

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const emitResult = program.emit();

const allDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(emitResult.diagnostics);

allDiagnostics.forEach((diagnostic) => {
  if (diagnostic.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      diagnostic.file,
      diagnostic.start || 0
    );
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );
    console.log(
      `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
    );
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
});

const errorDiagnostics = allDiagnostics.filter(
  (d) => d.category === ts.DiagnosticCategory.Error
);

console.log(`Diagnostics: ${allDiagnostics.length} (${errorDiagnostics.length} errors)`);
process.exit(errorDiagnostics.length > 0 ? 1 : 0);
