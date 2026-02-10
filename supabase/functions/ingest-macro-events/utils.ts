export function mapFinnhubEvent(e: any) {
    // Normalize impact level
    let impact = 'Low'
    if (e.impact === 'high') impact = 'High'
    else if (e.impact === 'medium') impact = 'Medium'

    // Finnhub time is usually in 'YYYY-MM-DD HH:mm:ss' format, but we need ISO or compatible
    const eventDate = e.time ? new Date(e.time.replace(' ', 'T') + 'Z') : new Date()

    return {
        event_date: eventDate.toISOString(),
        event_name: e.event,
        country: e.country,
        impact_level: impact,
        forecast: e.estimate ? String(e.estimate) + (e.unit || '') : null,
        previous: e.previous ? String(e.previous) + (e.unit || '') : null,
        actual: e.actual ? String(e.actual) + (e.unit || '') : null,
        surprise: e.actual && e.estimate ? String((e.actual - e.estimate).toFixed(2)) : null,
        source_url: 'Finnhub API'
    }
}
