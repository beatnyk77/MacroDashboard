const serviceKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';
const projectRef = 'debdriyzfcwvgrhzzzre';
const url = `https://${projectRef}.supabase.co/functions/v1/ingest-us-macro?task=fred`;

async function trigger() {
  try {
    console.log(`Triggering ingestion for task 'fred' via: ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({})
    });

    console.log('Status:', res.status);
    const text = await res.text();
    try {
      console.log(JSON.parse(text));
    } catch {
      console.log(text);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

trigger();
