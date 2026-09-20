// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { findRelevantDocs } from './knowledgeCorpus.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { question, pageId: _pageId, docScope, history } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const relevantDocs = findRelevantDocs(question, docScope);
    const citations = relevantDocs.map(d => ({
      title: d.title,
      url: d.url,
      snippet: d.summary
    }));

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('AIMLAPI_KEY');
    const OPENAI_BASE_URL = Deno.env.get('OPENAI_BASE_URL') || 
      (Deno.env.get('OPENROUTER_API_KEY') ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

    // Create a streaming SSE response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Send initial status and citations
          sendEvent('status', { status: 'reading-docs', message: 'Scanning documentation corpus...' });
          sendEvent('citations', citations);

          if (OPENAI_API_KEY) {
            // Stream from OpenAI / OpenRouter
            const contextText = relevantDocs.map(d => `### ${d.title} (URL: ${d.url})\n${d.content}`).join('\n\n');
            const systemPrompt = `You are the GraphiQuestor Institutional Macro Intelligence Engine.
You provide precise, institutional-grade analytical answers for professional capital allocators, macro hedge funds, and central bank watchers.
Doctrine: "Observe structural reality. Do not forecast."
Be concise, mathematically sound, and factual.
Ground your response strictly in the following product documentation:

${contextText}

Guidelines:
1. Provide a direct, authoritative explanation. Use Markdown (bolding, lists, mathematical formulas where appropriate).
2. When mentioning methodologies, link to internal documentation using Markdown: [Title](${relevantDocs[0]?.url || '/methods'}).
3. State data sources (FRED, RBI DBIE, EIA, TreasuryDirect) and update frequencies where applicable.
4. Keep the response high-density and under 250 words.`;

            const messages = [
              { role: 'system', content: systemPrompt },
              ...(Array.isArray(history) ? history.slice(-4) : []),
              { role: 'user', content: question },
            ];

            const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: Deno.env.get('OPENROUTER_API_KEY') ? 'anthropic/claude-3.5-haiku' : 'gpt-4o-mini',
                messages,
                stream: true,
                temperature: 0.2,
                max_tokens: 600,
              }),
            });

            if (!response.ok || !response.body) {
              throw new Error(`LLM API returned status ${response.status}`);
            }

            sendEvent('status', { status: 'streaming', message: 'Streaming intelligence...' });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.slice(6);
                if (jsonStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    sendEvent('delta', { content });
                  }
                } catch {
                  // Ignore JSON parse chunk errors
                }
              }
            }
          } else {
            // Deterministic Fallback Stream (Grounded Synthesis)
            sendEvent('status', { status: 'streaming', message: 'Synthesizing documentation...' });

            const topDoc = relevantDocs[0];
            const synthChunks = [
              `**Intelligence Briefing: ${topDoc.title}**\n\n`,
              `${topDoc.summary}\n\n`,
              `### Analytical Framework\n`,
              `${topDoc.content.slice(0, 320)}...\n\n`,
              `For in-depth mathematical formulations and live time-series telemetry, consult the primary methodology document: [${topDoc.title}](${topDoc.url}).`
            ];

            for (const chunk of synthChunks) {
              sendEvent('delta', { content: chunk });
              // Micro-delay to simulate natural terminal streaming
              await new Promise(r => setTimeout(r, 60));
            }
          }

          sendEvent('done', { completed: true });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Error generating RAG response';
          sendEvent('error', { message: errMsg });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
