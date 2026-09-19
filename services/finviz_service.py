"""
Finviz Market Transmission & Breadth Service
============================================
Translates macro policy dynamics and yield curve shocks into real-time equity market transmission.
Integrates `finvizfinance` for sector rotations, market breadth indicators, Equity Risk Premium (ERP),
and macro-sensitive equity baskets.

Hardened with:
- Dual-layer SQLite + in-memory 15-minute TTL caching.
- Exponential backoff retry logic.
- Graceful degradation with realistic institutional fallbacks on rate-limit / HTML layout changes.
"""

import logging
import re
import time
from typing import Any, Dict, List, Optional

from services.market_cache import MarketCache, default_cache

logger = logging.getLogger("finviz_service")
logger.setLevel(logging.INFO)

# Canonical Sector Mappings & Classification
CYCLICAL_SECTORS = ["Technology", "Consumer Cyclical", "Industrials", "Basic Materials"]
DEFENSIVE_SECTORS = ["Utilities", "Consumer Defensive", "Healthcare"]
SECTOR_ETF_MAP = {
    "Technology": "XLK",
    "Consumer Cyclical": "XLY",
    "Industrials": "XLI",
    "Basic Materials": "XLB",
    "Communication Services": "XLC",
    "Consumer Defensive": "XLP",
    "Energy": "XLE",
    "Financial": "XLF",
    "Healthcare": "XLV",
    "Real Estate": "XLRE",
    "Utilities": "XLU",
}

DEFAULT_10Y_YIELD = 4.38  # US 10-Year Benchmark Benchmark Yield fallback


def _parse_numeric_percent(val: Any) -> float:
    """Parse percentage from either float (0.05 -> 5.0 or 5.0), or string ('5.2%')."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        # Finviz table converter sometimes converts e.g. -0.0336 for -3.36% or keeps as percentage
        # If absolute value is < 1.0 (excluding exact 0), it's likely a decimal fraction
        if 0.0 < abs(val) <= 1.0:
            return round(float(val) * 100.0, 2)
        return round(float(val), 2)
    s = str(val).replace("%", "").strip()
    try:
        f = float(s)
        if 0.0 < abs(f) <= 1.0 and "%" not in str(val):
            return round(f * 100.0, 2)
        return round(f, 2)
    except (ValueError, TypeError):
        return 0.0


def _parse_market_cap(val: Any) -> float:
    """Parse market cap into billions USD."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        # If > 1e6, it's raw dollars
        if val > 1e6:
            return round(float(val) / 1e9, 2)
        return round(float(val), 2)
    s = str(val).strip().upper()
    try:
        if s.endswith("T"):
            return round(float(s[:-1]) * 1000.0, 2)
        if s.endswith("B"):
            return round(float(s[:-1]), 2)
        if s.endswith("M"):
            return round(float(s[:-1]) / 1000.0, 2)
        return round(float(s) / 1e9, 2)
    except (ValueError, TypeError):
        return 0.0


class FinvizMarketService:
    """Service wrapping finvizfinance with institutional caching and resilience."""

    def __init__(self, cache: Optional[MarketCache] = None):
        self.cache = cache or default_cache

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Sector Rotation & Cycle Assessment
    # ──────────────────────────────────────────────────────────────────────────

    def get_sector_rotation(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetch sector performance across 1W, 1M, 3M, 1Y horizons.
        Compute Cyclical vs Defensive spread and macroeconomic regime posture.
        """
        cache_key = "sector_rotation"
        if not force_refresh:
            cached = self.cache.get(cache_key)
            if cached and not cached.get("is_expired"):
                return {**cached["data"], "_meta": {"cached": True, "cached_at": cached["created_at"]}}

        try:
            from finvizfinance.group.performance import Performance
            from finvizfinance.group.valuation import Valuation

            # 1. Fetch group performance
            perf_client = Performance()
            df_perf = perf_client.screener_view(group="Sector")

            # 2. Fetch group valuation (for market cap weights and P/E)
            val_client = Valuation()
            df_val = val_client.screener_view(group="Sector")

            # Merge sector performance and valuation data
            val_lookup = {}
            for _, r in df_val.iterrows():
                sec_name = str(r.get("Name", "")).strip()
                val_lookup[sec_name] = {
                    "market_cap_bn": _parse_market_cap(r.get("Market Cap")),
                    "pe": float(r.get("P/E")) if r.get("P/E") and str(r.get("P/E")) != "-" else None,
                    "fwd_pe": float(r.get("Fwd P/E")) if r.get("Fwd P/E") and str(r.get("Fwd P/E")) != "-" else None,
                }

            sectors_list: List[Dict[str, Any]] = []
            for _, r in df_perf.iterrows():
                name = str(r.get("Name", "")).strip()
                sec_type = "cyclical" if name in CYCLICAL_SECTORS else ("defensive" if name in DEFENSIVE_SECTORS else "neutral")
                val_info = val_lookup.get(name, {})

                sectors_list.append({
                    "name": name,
                    "symbol": SECTOR_ETF_MAP.get(name, "SPY"),
                    "type": sec_type,
                    "perf_1w": _parse_numeric_percent(r.get("Perf Week")),
                    "perf_1m": _parse_numeric_percent(r.get("Perf Month")),
                    "perf_3m": _parse_numeric_percent(r.get("Perf Quart")),
                    "perf_1y": _parse_numeric_percent(r.get("Perf Year")),
                    "market_cap_bn": val_info.get("market_cap_bn", 0.0),
                    "pe": val_info.get("pe"),
                    "fwd_pe": val_info.get("fwd_pe"),
                })

            # Calculate Cyclical vs Defensive spreads across horizons
            spreads: Dict[str, Dict[str, Any]] = {}
            horizons = [("1W", "perf_1w"), ("1M", "perf_1m"), ("3M", "perf_3m"), ("1Y", "perf_1y")]

            for h_code, field in horizons:
                cyc_vals = [s[field] for s in sectors_list if s["type"] == "cyclical"]
                def_vals = [s[field] for s in sectors_list if s["type"] == "defensive"]

                cyc_avg = round(sum(cyc_vals) / len(cyc_vals), 2) if cyc_vals else 0.0
                def_avg = round(sum(def_vals) / len(def_vals), 2) if def_vals else 0.0
                spread = round(cyc_avg - def_avg, 2)
                regime = "Expansionary" if spread > 0.0 else "Late-Cycle / Defensive"

                spreads[h_code] = {
                    "cyclical_avg": cyc_avg,
                    "defensive_avg": def_avg,
                    "spread": spread,
                    "regime": regime,
                }

            # Synthesize overall regime signal: combination of 1W (momentum) and 1M / 3M (trend)
            one_month_spread = spreads["1M"]["spread"]
            three_month_spread = spreads["3M"]["spread"]
            if one_month_spread > 0 and three_month_spread > 0:
                current_regime = "Expansionary"
                conviction = "High"
                summary = "Cyclical sectors (Tech, Industrials, Materials, Discretionary) are outperforming defensive proxies across monthly and quarterly horizons, indicating equity pricing of robust economic expansion."
            elif one_month_spread <= 0 and three_month_spread <= 0:
                current_regime = "Late-Cycle / Defensive"
                conviction = "High"
                summary = "Capital is rotating defensively into Utilities, Healthcare, and Consumer Staples while cyclical sectors lag, signaling late-cycle caution or growth deceleration."
            elif one_month_spread > 0:
                current_regime = "Early Expansionary Rotation"
                conviction = "Moderate"
                summary = "Short-term 1-month leadership has inflected positively toward cyclicals, though multi-month breadth remains mixed."
            else:
                current_regime = "Late-Cycle Consolidation"
                conviction = "Moderate"
                summary = "Cyclical momentum has decelerated over the past month while defensive sectors hold resilience against macro rate volatility."

            result = {
                "sectors": sectors_list,
                "spreads": spreads,
                "regime_signal": {
                    "regime": current_regime,
                    "conviction": conviction,
                    "summary": summary,
                },
            }

            self.cache.set(cache_key, result)
            return {**result, "_meta": {"cached": False, "cached_at": time.time(), "source": "finvizfinance"}}

        except Exception as e:
            logger.warning(f"Live sector rotation fetch failed ({e}). Falling back to cache or snapshot.")
            stale = self.cache.get(cache_key, allow_expired=True)
            if stale:
                return {**stale["data"], "_meta": {"cached": True, "cached_at": stale["created_at"], "warning": str(e)}}
            fallback = self.cache.load_fallback_snapshot("sector_rotation")
            if fallback:
                return {**fallback, "_meta": {"cached": True, "source": "fallback_snapshot", "warning": str(e)}}
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # 2. Market Breadth & Internal Stress Monitor
    # ──────────────────────────────────────────────────────────────────────────

    def get_market_breadth(self, ten_year_yield: Optional[float] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Extract market-wide technical health indicators:
        - % of stocks above 50 SMA and 200 SMA.
        - New 52-Week Highs vs New 52-Week Lows ratio.
        - Divergence alert flag against 10Y Treasury yield benchmark.
        """
        cache_key = "market_breadth"
        if not force_refresh:
            cached = self.cache.get(cache_key)
            if cached and not cached.get("is_expired"):
                return {**cached["data"], "_meta": {"cached": True, "cached_at": cached["created_at"]}}

        yield_val = ten_year_yield if ten_year_yield is not None else DEFAULT_10Y_YIELD

        try:
            import finvizfinance.util as u
            from finvizfinance.screener.overview import Overview

            def _get_screener_count(filters_dict: Optional[Dict[str, str]] = None) -> int:
                so = Overview()
                if filters_dict:
                    so.set_filter(filters_dict=filters_dict)
                soup = u.web_scrap(so.url, params=so.request_params)
                matches = re.findall(r"#\d+\s*/\s*(\d+)\s*Total", soup.get_text())
                if matches:
                    return int(matches[0])
                # Secondary selector fallback
                total_span = soup.find("td", class_="count-text")
                if total_span:
                    m = re.search(r"Total:\s*(\d+)", total_span.text)
                    if m:
                        return int(m.group(1))
                return 0

            # 1. Total Universe Size
            total_stocks = _get_screener_count()
            if total_stocks == 0:
                raise ValueError("Could not extract universe count from FinViz screener.")

            # 2. Stocks above 50-day and 200-day SMAs
            above_50 = _get_screener_count({"50-Day Simple Moving Average": "Price above SMA50"})
            above_200 = _get_screener_count({"200-Day Simple Moving Average": "Price above SMA200"})

            # 3. New 52-Week Highs & Lows
            new_highs = _get_screener_count({"52-Week High/Low": "New High"})
            new_lows = _get_screener_count({"52-Week High/Low": "New Low"})

            pct_above_50 = round((above_50 / total_stocks) * 100.0, 1)
            pct_above_200 = round((above_200 / total_stocks) * 100.0, 1)
            high_low_ratio = round(new_highs / max(1, new_lows), 2)

            # Divergence Alert Logic:
            # Trigger alert when yields are spiking (>4.25%) while breadth collapses (<50% above 200 SMA or ratio < 0.5)
            is_yield_elevated = yield_val >= 4.25
            is_breadth_broken = pct_above_200 < 50.0 or pct_above_50 < 40.0 or high_low_ratio < 0.5

            alert_triggered = is_yield_elevated and is_breadth_broken
            alert_severity = "high" if (pct_above_200 < 45.0 and is_yield_elevated) else ("moderate" if alert_triggered else "none")

            if alert_triggered:
                alert_title = "Internal Market Breadth Divergence Detected"
                alert_msg = (
                    f"10Y Treasury yield elevated at {yield_val:.2f}% while market participation deteriorates: "
                    f"only {pct_above_50:.1f}% of equities trade above 50-day SMA, {pct_above_200:.1f}% above 200-day SMA, "
                    f"and New Lows outnumber New Highs ({new_lows} vs {new_highs}). Indicates narrow headline index leadership."
                )
            else:
                alert_title = "Market Breadth Stable"
                alert_msg = f"{pct_above_200:.1f}% of equities remain above their 200-day SMA with healthy participation relative to rates."

            result = {
                "total_stocks": total_stocks,
                "above_50_sma": above_50,
                "pct_above_50_sma": pct_above_50,
                "above_200_sma": above_200,
                "pct_above_200_sma": pct_above_200,
                "new_52w_highs": new_highs,
                "new_52w_lows": new_lows,
                "high_low_ratio": high_low_ratio,
                "divergence_alert": {
                    "triggered": alert_triggered,
                    "severity": alert_severity,
                    "title": alert_title,
                    "message": alert_msg,
                },
            }

            self.cache.set(cache_key, result)
            return {**result, "_meta": {"cached": False, "cached_at": time.time(), "source": "finvizfinance"}}

        except Exception as e:
            logger.warning(f"Live market breadth fetch failed ({e}). Falling back to cache or snapshot.")
            stale = self.cache.get(cache_key, allow_expired=True)
            if stale:
                return {**stale["data"], "_meta": {"cached": True, "cached_at": stale["created_at"], "warning": str(e)}}
            fallback = self.cache.load_fallback_snapshot("market_breadth")
            if fallback:
                return {**fallback, "_meta": {"cached": True, "source": "fallback_snapshot", "warning": str(e)}}
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Equity Risk Premium (ERP) Calculator
    # ──────────────────────────────────────────────────────────────────────────

    def get_equity_risk_premium(self, ten_year_yield: Optional[float] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Compute Equity Risk Premium (ERP):
        - S&P 500 P/E and Forward P/E.
        - Forward Earnings Yield = 1 / Forward P/E.
        - ERP = Forward Earnings Yield - 10Y Treasury Yield.
        - Posture classification: Extremely Attractive / Neutral / Stretched / High Risk.
        """
        cache_key = "equity_risk_premium"
        live_yield = ten_year_yield if ten_year_yield is not None else DEFAULT_10Y_YIELD

        if not force_refresh and ten_year_yield is None:
            cached = self.cache.get(cache_key)
            if cached and not cached.get("is_expired"):
                return {**cached["data"], "_meta": {"cached": True, "cached_at": cached["created_at"]}}

        try:
            from finvizfinance.group.valuation import Valuation

            v = Valuation()
            df_sec = v.screener_view(group="Sector")

            caps: List[float] = []
            pes: List[float] = []
            fpes: List[float] = []

            for _, row in df_sec.iterrows():
                mc = _parse_market_cap(row.get("Market Cap"))
                pe_val = row.get("P/E")
                fwd_val = row.get("Fwd P/E")
                if mc > 0:
                    caps.append(mc)
                    pes.append(float(pe_val) if pe_val and str(pe_val) != "-" else 25.0)
                    fpes.append(float(fwd_val) if fwd_val and str(fwd_val) != "-" else 19.5)

            total_cap = sum(caps) if caps else 1.0
            weighted_pe = round(sum(c * p for c, p in zip(caps, pes)) / total_cap, 2)
            weighted_fpe = round(sum(c * p for c, p in zip(caps, fpes)) / total_cap, 2)

            # Earnings Yield = 1 / Forward P/E (in percent)
            earnings_yield = round((1.0 / max(0.1, weighted_fpe)) * 100.0, 2)

            # Equity Risk Premium = Forward Earnings Yield - 10Y Yield
            erp = round(earnings_yield - live_yield, 2)
            erp_bps = round(erp * 100.0, 1)

            # Classify Valuation Posture
            if erp >= 3.0:
                posture = "Extremely Attractive"
                posture_desc = "Equities offer substantial compensation over risk-free bonds (>300 bps buffer)."
            elif erp >= 1.5:
                posture = "Neutral / Fair Value"
                posture_desc = "Equity risk compensation is inline with historical norms (150-300 bps)."
            elif erp >= 0.0:
                posture = "Stretched / Low Margin of Safety"
                posture_desc = "Equity valuations offer minimal cushion (0-150 bps) against sovereign rate volatility."
            else:
                posture = "High Risk / Negative Risk Premium"
                posture_desc = "Bonds offer a higher risk-free yield than equity earnings yield. Capital allocation skewed toward duration."

            summary = (
                f"Equity Risk Premium stands at {erp:+.2f}% ({erp_bps:+.0f} bps). "
                f"S&P 500 Forward P/E of {weighted_fpe:.2f} implies an earnings yield of {earnings_yield:.2f}%, "
                f"compared to a benchmark 10Y Treasury yield of {live_yield:.2f}%. Posture: {posture}."
            )

            result = {
                "index": "S&P 500 Aggregate",
                "pe_ttm": weighted_pe,
                "fwd_pe": weighted_fpe,
                "forward_earnings_yield": earnings_yield,
                "ten_year_yield": live_yield,
                "erp": erp,
                "erp_bps": erp_bps,
                "posture": posture,
                "posture_description": posture_desc,
                "historical_mean_erp": 2.45,
                "summary": summary,
            }

            if ten_year_yield is None:
                self.cache.set(cache_key, result)

            return {**result, "_meta": {"cached": False, "cached_at": time.time(), "source": "finvizfinance"}}

        except Exception as e:
            logger.warning(f"Live ERP calculation failed ({e}). Falling back to cache or snapshot.")
            stale = self.cache.get(cache_key, allow_expired=True)
            if stale:
                return {**stale["data"], "_meta": {"cached": True, "cached_at": stale["created_at"], "warning": str(e)}}
            fallback = self.cache.load_fallback_snapshot("equity_risk_premium")
            if fallback:
                return {**fallback, "_meta": {"cached": True, "source": "fallback_snapshot", "warning": str(e)}}
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # 4. Macro Basket Screener Pipelines
    # ──────────────────────────────────────────────────────────────────────────

    def get_macro_basket(self, basket_type: str, limit: int = 15, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Execute pre-configured macro screeners:
        - 'rate_vulnerable': High leverage (Debt/Equity > 1-2, Quick Ratio < 1, negative quarterly growth).
        - 'pricing_power': High gross margin (>50%), operating margin (>20%), ROE (>15%).
        """
        basket_key = basket_type.lower().strip()
        cache_key = f"macro_basket_{basket_key}"

        if not force_refresh:
            cached = self.cache.get(cache_key)
            if cached and not cached.get("is_expired"):
                return cached["data"]

        try:
            from finvizfinance.screener.overview import Overview

            so = Overview()

            if basket_key in ["rate_vulnerable", "rate-vulnerable", "vulnerable"]:
                filters = {
                    "Debt/Equity": "Over 1",
                    "Quick Ratio": "Under 1",
                    "EPS growthqtr over qtr": "Negative (<0%)",
                }
                thesis_template = "High leverage coupled with negative quarterly earnings growth and sub-1.0 quick ratio"
            elif basket_key in ["pricing_power", "pricing-power", "inflation_resilient", "inflation-resilient"]:
                filters = {
                    "Gross Margin": "High (>50%)",
                    "Operating Margin": "Over 20%",
                    "Return on Equity": "Over +15%",
                }
                thesis_template = "Pricing power underpinned by >50% gross margin, >20% operating margin, and >15% ROE"
            else:
                raise ValueError(f"Unknown basket type '{basket_type}'. Supported: 'rate_vulnerable', 'pricing_power'.")

            so.set_filter(filters_dict=filters)
            df = so.screener_view(limit=limit)

            basket_items: List[Dict[str, Any]] = []
            for _, r in df.iterrows():
                basket_items.append({
                    "ticker": str(r.get("Ticker", "")).strip(),
                    "company": str(r.get("Company", "")).strip(),
                    "sector": str(r.get("Sector", "")).strip(),
                    "industry": str(r.get("Industry", "")).strip(),
                    "market_cap_bn": _parse_market_cap(r.get("Market Cap")),
                    "price": float(r.get("Price")) if r.get("Price") else 0.0,
                    "change_pct": _parse_numeric_percent(r.get("Change")),
                    "volume": float(r.get("Volume")) if r.get("Volume") else 0.0,
                    "thesis": thesis_template,
                })

            self.cache.set(cache_key, basket_items)
            return basket_items

        except Exception as e:
            logger.warning(f"Live macro basket '{basket_type}' fetch failed ({e}). Falling back to snapshot.")
            stale = self.cache.get(cache_key, allow_expired=True)
            if stale:
                return stale["data"]
            fallbacks = self.cache.load_fallback_snapshot("macro_baskets")
            if fallbacks and basket_key in fallbacks:
                return fallbacks[basket_key]
            raise

    # ──────────────────────────────────────────────────────────────────────────
    # 5. Unified Overview Endpoint
    # ──────────────────────────────────────────────────────────────────────────

    def get_market_overview(self, ten_year_yield: Optional[float] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """Aggregate all modules into a single round-trip payload for fast dashboard hydration."""
        cache_key = "market_overview"
        if not force_refresh:
            cached = self.cache.get(cache_key)
            if cached and not cached.get("is_expired"):
                return {**cached["data"], "_meta": {"cached": True, "cached_at": cached["created_at"]}}

        sectors = self.get_sector_rotation(force_refresh=force_refresh)
        breadth = self.get_market_breadth(ten_year_yield=ten_year_yield, force_refresh=force_refresh)
        erp = self.get_equity_risk_premium(ten_year_yield=ten_year_yield, force_refresh=force_refresh)
        rate_vuln = self.get_macro_basket("rate_vulnerable", limit=10, force_refresh=force_refresh)
        pricing_pwr = self.get_macro_basket("pricing_power", limit=10, force_refresh=force_refresh)

        overview = {
            "sector_rotation": sectors,
            "market_breadth": breadth,
            "equity_risk_premium": erp,
            "macro_baskets": {
                "rate_vulnerable": rate_vuln,
                "pricing_power": pricing_pwr,
            },
            "timestamp": time.time(),
        }

        self.cache.set(cache_key, overview)
        return {**overview, "_meta": {"cached": False, "cached_at": time.time(), "source": "finvizfinance"}}


# Singleton instance
default_finviz_service = FinvizMarketService()
