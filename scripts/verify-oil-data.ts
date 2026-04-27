import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase config')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyOilSpread() {
  const { data, error } = await supabase
    .from('oil_market_spread')
    .select('*')
    .order('date', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Recent Oil Spread Data:')
  console.table(data.map(d => ({
    date: d.date,
    front: d.front_price,
    next: d.next_price,
    spread: d.spread,
    regime: d.regime
  })))
}

verifyOilSpread()
