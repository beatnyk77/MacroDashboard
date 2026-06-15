#!/usr/bin/env node
/**
 * Strips GraphiQuestor CLI flags from argv, sets env, then spawns the remainder.
 *
 * Supported flags (removed before spawn):
 *   --enable-error-reporting   → VITE_ENABLE_ERROR_REPORTING=true
 *   --no-enable-error-reporting → VITE_ENABLE_ERROR_REPORTING=false
 *
 * Usage:
 *   node scripts/run-with-flags.mjs vite
 *   node scripts/run-with-flags.mjs npm run generate-sitemap && tsc && vite build
 */

import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const forwarded = [];
const env = { ...process.env };

for (const arg of rawArgs) {
    if (arg === '--enable-error-reporting') {
        env.VITE_ENABLE_ERROR_REPORTING = 'true';
    } else if (arg === '--no-enable-error-reporting') {
        env.VITE_ENABLE_ERROR_REPORTING = 'false';
    } else {
        forwarded.push(arg);
    }
}

if (env.VITE_ENABLE_ERROR_REPORTING === undefined) {
    env.VITE_ENABLE_ERROR_REPORTING = 'false';
}

const child = spawn(forwarded.join(' '), {
    stdio: 'inherit',
    shell: true,
    env,
});

child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
});