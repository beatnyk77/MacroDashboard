import { z } from 'zod';

export const configSchema = z.object({
  supabaseUrl: z.string().url().describe('Supabase project URL'),
  supabaseAnonKey: z.string().min(1).describe('Supabase anon key (read-only)'),
  gqBaseUrl: z.string().url().default('https://graphiquestor.com').describe('GraphiQuestor base URL for deep links'),
});

export type ServerConfig = z.infer<typeof configSchema>;

export function loadConfigFromEnv(): ServerConfig {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const gqBaseUrl = process.env.GQ_BASE_URL ?? 'https://graphiquestor.com';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_* equivalents). Copy from .env.local in the MacroDashboard root.'
    );
  }

  return configSchema.parse({ supabaseUrl, supabaseAnonKey, gqBaseUrl });
}

export function loadConfigFromArgs(argv: string[]): ServerConfig {
  const get = (name: string): string | undefined => {
    const flag = `--${name}`;
    const idx = argv.indexOf(flag);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    const kebab = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    const envKey = name.replace(/([A-Z])/g, '_$1').toUpperCase();
    return process.env[envKey] ?? process.env[kebab.toUpperCase().replace(/-/g, '_')];
  };

  const supabaseUrl = get('supabaseUrl') ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = get('supabaseAnonKey') ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const gqBaseUrl = get('gqBaseUrl') ?? process.env.GQ_BASE_URL ?? 'https://graphiquestor.com';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing supabaseUrl and supabaseAnonKey configuration.');
  }

  return configSchema.parse({ supabaseUrl, supabaseAnonKey, gqBaseUrl });
}