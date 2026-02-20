export const INITIAL_LIQUIDITY_STRESS_DATA = [
    // 2023 - Broadly Surplus or Neutral
    { date: '2023-01-15', laf_net_injection_cr: -125000, repo_rate: 6.25, msf_rate: 6.50, call_rate: 6.15, treps_rate: 6.10, updated_at: new Date().toISOString() },
    { date: '2023-02-15', laf_net_injection_cr: -85000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.35, treps_rate: 6.25, updated_at: new Date().toISOString() },
    { date: '2023-03-15', laf_net_injection_cr: -45000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.45, treps_rate: 6.40, updated_at: new Date().toISOString() },
    { date: '2023-04-15', laf_net_injection_cr: -150000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.30, treps_rate: 6.25, updated_at: new Date().toISOString() },
    { date: '2023-05-15', laf_net_injection_cr: -90000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.40, treps_rate: 6.35, updated_at: new Date().toISOString() },
    { date: '2023-06-15', laf_net_injection_cr: -180000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.20, treps_rate: 6.15, updated_at: new Date().toISOString() },
    { date: '2023-07-15', laf_net_injection_cr: -110000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.45, treps_rate: 6.40, updated_at: new Date().toISOString() },
    { date: '2023-08-15', laf_net_injection_cr: -50000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.60, treps_rate: 6.55, updated_at: new Date().toISOString() },
    { date: '2023-09-15', laf_net_injection_cr: 15000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.70, treps_rate: 6.65, updated_at: new Date().toISOString() }, // Shift to deficit

    // Tightening Period
    { date: '2023-10-15', laf_net_injection_cr: 85000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.78, treps_rate: 6.75, updated_at: new Date().toISOString() }, // Slight breach of MSF
    { date: '2023-11-15', laf_net_injection_cr: 145000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.82, treps_rate: 6.79, updated_at: new Date().toISOString() }, // Clear breach
    { date: '2023-12-15', laf_net_injection_cr: 220000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.85, treps_rate: 6.81, updated_at: new Date().toISOString() }, // Deep deficit
    { date: '2024-01-15', laf_net_injection_cr: 185000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.77, treps_rate: 6.74, updated_at: new Date().toISOString() },
    { date: '2024-02-15', laf_net_injection_cr: 110000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.70, treps_rate: 6.68, updated_at: new Date().toISOString() },
    { date: '2024-03-15', laf_net_injection_cr: 75000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.65, treps_rate: 6.62, updated_at: new Date().toISOString() },
    { date: '2024-04-15', laf_net_injection_cr: -25000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.55, treps_rate: 6.50, updated_at: new Date().toISOString() },
    { date: '2024-05-15', laf_net_injection_cr: 45000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.68, treps_rate: 6.65, updated_at: new Date().toISOString() },
    { date: '2024-06-15', laf_net_injection_cr: 120000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.76, treps_rate: 6.73, updated_at: new Date().toISOString() }, // Another breach
    { date: '2024-07-15', laf_net_injection_cr: 165000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.81, treps_rate: 6.78, updated_at: new Date().toISOString() }, // Another breach
    { date: '2024-08-15', laf_net_injection_cr: 140000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.78, treps_rate: 6.75, updated_at: new Date().toISOString() },
    { date: '2024-09-15', laf_net_injection_cr: 95000, repo_rate: 6.50, msf_rate: 6.75, call_rate: 6.71, treps_rate: 6.69, updated_at: new Date().toISOString() }
];
