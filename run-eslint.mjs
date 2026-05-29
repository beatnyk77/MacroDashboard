import { ESLint } from "eslint";

async function run() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(["src/**/*.ts", "src/**/*.tsx"]);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  console.log("ESLINT RESULTS:\n", resultText);
}
run().catch(console.error);
