import "https://deno.land/std@0.177.0/dotenv/load.ts";
const key = Deno.env.get("FRED_API_KEY");
async function check(id: string) {
  const r = await fetch(`https://api.stlouisfed.org/fred/series?series_id=${id}&api_key=${key}&file_type=json`);
  const d = await r.json();
  if(d.seriess) {
    console.log(id, d.seriess[0].title, d.seriess[0].observation_end);
  } else {
    console.log(id, "NOT FOUND or ERROR");
  }
}
await check("WLRRA");
await check("FYOINT");
await check("FGDEF");
