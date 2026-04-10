/* eslint-disable no-undef */
import { assertEquals } from "@std/assert";
import { mapFinnhubEvent } from "./utils.ts";

Deno.test("mapFinnhubEvent - maps high impact USD event correctly", () => {
    const mockEvent = {
        actual: 0.3,
        country: "USD",
        estimate: 0.2,
        event: "CPI m/m",
        impact: "high",
        previous: 0.1,
        time: "2026-02-11 13:30:00",
        unit: "%"
    };

    const result = mapFinnhubEvent(mockEvent);

    assertEquals(result.event_name, "CPI m/m");
    assertEquals(result.country, "USD");
    assertEquals(result.impact_level, "High");
    assertEquals(result.actual, "0.3%");
    assertEquals(result.forecast, "0.2%");
    assertEquals(result.previous, "0.1%");
    assertEquals(result.surprise, "0.10");
    assertEquals(result.event_date.endsWith("Z"), true); // Ensures UTC
});

Deno.test("mapFinnhubEvent - handles missing estimates", () => {
    const mockEvent = {
        actual: null,
        country: "INR",
        estimate: null,
        event: "RBI Interest Rate Decision",
        impact: "medium",
        previous: 6.5,
        time: "2026-02-11 05:30:00",
        unit: "%"
    };

    const result = mapFinnhubEvent(mockEvent);

    assertEquals(result.impact_level, "Medium");
    assertEquals(result.actual, null);
    assertEquals(result.forecast, null);
    assertEquals(result.previous, "6.5%");
    assertEquals(result.surprise, null);
});

Deno.test("mapFinnhubEvent - handles low impact and different unit", () => {
    const mockEvent = {
        actual: 50.5,
        country: "EUR",
        estimate: 49.8,
        event: "Manufacturing PMI",
        impact: "low",
        previous: 49.2,
        time: "2026-02-11 08:30:00",
        unit: ""
    };

    const result = mapFinnhubEvent(mockEvent);

    assertEquals(result.impact_level, "Low");
    assertEquals(result.actual, "50.5");
    assertEquals(result.forecast, "49.8");
    assertEquals(result.surprise, "0.70");
});
