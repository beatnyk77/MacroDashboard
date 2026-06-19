import type { ToolEnvelope } from '../types.js';

export function toolResult<T>(envelope: ToolEnvelope<T>) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(envelope, null, 2),
      },
    ],
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}