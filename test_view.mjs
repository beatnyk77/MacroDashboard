import { createClient } from '@supabase/supabase-js';

const url = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc';

const supabase = createClient(url, key);

async function testQuery() {
    const { data, error } = await supabase
        .from('vw_latest_daily_signal')
        .select('*')
        .single();
    
    console.log("Error:", error);
    console.log("Data:", data);
}

testQuery();
