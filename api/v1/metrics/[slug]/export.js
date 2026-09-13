const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  for (const [key, value] of Object.entries({
    ...corsHeaders,
    'Content-Type': 'application/json',
    ...extraHeaders,
  })) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, OPTIONS' });
    return;
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const formatParam = Array.isArray(req.query.format) ? req.query.format[0] : req.query.format;
  const format = String(formatParam || 'json').toLowerCase();

  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    sendJson(res, 400, { error: 'Valid metric slug is required' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    sendJson(res, 500, { error: 'Supabase configuration missing' });
    return;
  }

  const endpoint = new URL('/rest/v1/metric_observations', supabaseUrl);
  endpoint.searchParams.set('metric_id', `eq.${slug}`);
  endpoint.searchParams.set('select', 'as_of_date,value');
  endpoint.searchParams.set('order', 'as_of_date.desc');

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Supabase: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const cacheControl = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';
    const cdnCacheHeaders = {
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
      'Vercel-CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    };

    if (format === 'csv') {
      const lines = ['as_of_date,value'];
      for (const row of data) {
        lines.push(`${row.as_of_date},${row.value}`);
      }

      res.statusCode = 200;
      for (const [key, value] of Object.entries({
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-export.csv"`,
        ...cdnCacheHeaders,
      })) {
        res.setHeader(key, value);
      }
      res.end(lines.join('\n'));
      return;
    }

    sendJson(res, 200, { metricId: slug, data }, cdnCacheHeaders);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown export error' });
  }
}
