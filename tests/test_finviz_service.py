"""
Automated Unit & Integration Tests for Finviz Market Transmission Service
=========================================================================
Uses mocked responses to isolate tests from external web scraping during CI/CD.
Verifies calculations, regime classification, breadth alerts, ERP math,
caching layer hygiene (15-min TTL), and graceful fallback degradation.
"""

import json
import os
import tempfile
import time
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest
from bs4 import BeautifulSoup

from services.finviz_service import (
    CYCLICAL_SECTORS,
    DEFENSIVE_SECTORS,
    FinvizMarketService,
    _parse_market_cap,
    _parse_numeric_percent,
)
from services.market_cache import MarketCache


@pytest.fixture
def temp_cache():
    """Create a temporary isolated SQLite cache for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test_cache.sqlite3")
        cache = MarketCache(db_path=db_path, default_ttl=900)
        yield cache


@pytest.fixture
def mock_sector_perf_df():
    """Mock Sector Performance DataFrame from Finviz."""
    data = [
        {"Name": "Basic Materials", "Perf Week": "-1.50%", "Perf Month": "2.10%", "Perf Quart": "5.00%", "Perf Year": "15.00%"},
        {"Name": "Communication Services", "Perf Week": "0.50%", "Perf Month": "1.20%", "Perf Quart": "-1.00%", "Perf Year": "12.00%"},
        {"Name": "Consumer Cyclical", "Perf Week": "1.80%", "Perf Month": "3.50%", "Perf Quart": "6.20%", "Perf Year": "18.50%"},
        {"Name": "Consumer Defensive", "Perf Week": "-0.20%", "Perf Month": "-1.10%", "Perf Quart": "1.00%", "Perf Year": "4.50%"},
        {"Name": "Energy", "Perf Week": "2.00%", "Perf Month": "4.00%", "Perf Quart": "8.00%", "Perf Year": "25.00%"},
        {"Name": "Financial", "Perf Week": "0.80%", "Perf Month": "1.50%", "Perf Quart": "3.00%", "Perf Year": "14.00%"},
        {"Name": "Healthcare", "Perf Week": "0.10%", "Perf Month": "0.20%", "Perf Quart": "2.00%", "Perf Year": "8.00%"},
        {"Name": "Industrials", "Perf Week": "1.20%", "Perf Month": "2.80%", "Perf Quart": "4.50%", "Perf Year": "16.00%"},
        {"Name": "Real Estate", "Perf Week": "-1.00%", "Perf Month": "-2.50%", "Perf Quart": "-3.00%", "Perf Year": "-2.00%"},
        {"Name": "Technology", "Perf Week": "2.50%", "Perf Month": "4.50%", "Perf Quart": "7.50%", "Perf Year": "32.00%"},
        {"Name": "Utilities", "Perf Week": "-1.50%", "Perf Month": "-2.00%", "Perf Quart": "-4.00%", "Perf Year": "2.00%"},
    ]
    return pd.DataFrame(data)


@pytest.fixture
def mock_sector_val_df():
    """Mock Sector Valuation DataFrame from Finviz."""
    data = [
        {"Name": "Basic Materials", "Market Cap": "3000.0B", "P/E": "20.0", "Fwd P/E": "15.0"},
        {"Name": "Communication Services", "Market Cap": "12000.0B", "P/E": "18.0", "Fwd P/E": "17.0"},
        {"Name": "Consumer Cyclical", "Market Cap": "9000.0B", "P/E": "24.0", "Fwd P/E": "20.0"},
        {"Name": "Consumer Defensive", "Market Cap": "4500.0B", "P/E": "22.0", "Fwd P/E": "19.0"},
        {"Name": "Energy", "Market Cap": "5000.0B", "P/E": "14.0", "Fwd P/E": "12.0"},
        {"Name": "Financial", "Market Cap": "14000.0B", "P/E": "15.0", "Fwd P/E": "14.0"},
        {"Name": "Healthcare", "Market Cap": "9500.0B", "P/E": "28.0", "Fwd P/E": "18.0"},
        {"Name": "Industrials", "Market Cap": "9500.0B", "P/E": "30.0", "Fwd P/E": "24.0"},
        {"Name": "Real Estate", "Market Cap": "1800.0B", "P/E": "32.0", "Fwd P/E": "26.0"},
        {"Name": "Technology", "Market Cap": "35000.0B", "P/E": "32.0", "Fwd P/E": "22.0"},
        {"Name": "Utilities", "Market Cap": "1700.0B", "P/E": "18.0", "Fwd P/E": "16.0"},
    ]
    return pd.DataFrame(data)


# ──────────────────────────────────────────────────────────────────────────────
# 1. Sector Rotation Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_sector_rotation_calculation(temp_cache, mock_sector_perf_df, mock_sector_val_df):
    """Test Cyclical vs Defensive spread calculation and regime assignment."""
    service = FinvizMarketService(cache=temp_cache)

    with patch("finvizfinance.group.performance.Performance.screener_view", return_value=mock_sector_perf_df) as mock_perf, \
         patch("finvizfinance.group.valuation.Valuation.screener_view", return_value=mock_sector_val_df) as mock_val:

        res = service.get_sector_rotation()

        assert mock_perf.called
        assert mock_val.called
        assert len(res["sectors"]) == 11

        # Check spreads
        spreads = res["spreads"]
        assert "1W" in spreads
        assert "1M" in spreads
        assert "3M" in spreads
        assert "1Y" in spreads

        # In mock data, Technology (2.50%), Consumer Cyclical (1.80%), Industrials (1.20%), Materials (-1.50%)
        # Cyclical avg 1W = (2.50 + 1.80 + 1.20 - 1.50) / 4 = 1.00%
        assert spreads["1W"]["cyclical_avg"] == 1.00

        # Defensive 1W: Utilities (-1.50%), Consumer Defensive (-0.20%), Healthcare (0.10%)
        # Defensive avg 1W = (-1.50 - 0.20 + 0.10) / 3 = -0.53%
        assert spreads["1W"]["defensive_avg"] == -0.53

        # Spread = 1.00 - (-0.53) = +1.53% -> Expansionary
        assert spreads["1W"]["spread"] == 1.53
        assert spreads["1W"]["regime"] == "Expansionary"
        assert res["regime_signal"]["regime"] == "Expansionary"


# ──────────────────────────────────────────────────────────────────────────────
# 2. Market Breadth Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_market_breadth_and_divergence_alert(temp_cache):
    """Test breadth calculation and alert triggering when yields spike and breadth breaks."""
    service = FinvizMarketService(cache=temp_cache)

    # Return different simulated HTML for universe vs filters
    def fake_web_scrap(url, params=None):
        params = params or {}
        filter_str = params.get("f", "")
        if "ta_sma50_pa" in filter_str:
            count = "3500"
        elif "ta_sma200_pa" in filter_str:
            count = "4200"
        elif "ta_highlow52w_nh" in filter_str:
            count = "150"
        elif "ta_highlow52w_nl" in filter_str:
            count = "600"
        else:
            count = "10000"  # total universe

        html = f"<html><body><div>#1 / {count} Total</div></body></html>"
        return BeautifulSoup(html, "html.parser")

    with patch("finvizfinance.util.web_scrap", side_effect=fake_web_scrap):
        # 10Y yield = 4.40% (elevated)
        breadth = service.get_market_breadth(ten_year_yield=4.40)

        assert breadth["total_stocks"] == 10000
        assert breadth["above_50_sma"] == 3500
        assert breadth["pct_above_50_sma"] == 35.0
        assert breadth["above_200_sma"] == 4200
        assert breadth["pct_above_200_sma"] == 42.0
        assert breadth["new_52w_highs"] == 150
        assert breadth["new_52w_lows"] == 600
        assert breadth["high_low_ratio"] == 0.25

        # Breadth < 50% above 200 SMA and yields >= 4.25% must trigger divergence alert
        alert = breadth["divergence_alert"]
        assert alert["triggered"] is True
        assert alert["severity"] in ["high", "moderate"]
        assert "Divergence" in alert["title"]


# ──────────────────────────────────────────────────────────────────────────────
# 3. Equity Risk Premium Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_equity_risk_premium_calculation(temp_cache, mock_sector_val_df):
    """Test ERP math and valuation posture classification."""
    service = FinvizMarketService(cache=temp_cache)

    with patch("finvizfinance.group.valuation.Valuation.screener_view", return_value=mock_sector_val_df):
        # Test with high yield (4.50%) -> expect stretched / narrow posture
        erp_res = service.get_equity_risk_premium(ten_year_yield=4.50)

        assert "forward_earnings_yield" in erp_res
        assert erp_res["ten_year_yield"] == 4.50

        ey = erp_res["forward_earnings_yield"]
        expected_erp = round(ey - 4.50, 2)
        assert erp_res["erp"] == expected_erp
        assert erp_res["erp_bps"] == round(expected_erp * 100.0, 1)

        # Test posture classifications
        # If yield is 2.0% -> ERP is large -> Extremely Attractive
        low_yield_erp = service.get_equity_risk_premium(ten_year_yield=2.0)
        assert low_yield_erp["posture"] == "Extremely Attractive"

        # If yield is 6.5% -> ERP is negative -> High Risk
        high_yield_erp = service.get_equity_risk_premium(ten_year_yield=6.5)
        assert high_yield_erp["posture"] == "High Risk / Negative Risk Premium"


# ──────────────────────────────────────────────────────────────────────────────
# 4. Macro Basket Screener Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_macro_basket_screeners(temp_cache):
    """Test execution and formatting of rate-vulnerable and pricing-power screeners."""
    service = FinvizMarketService(cache=temp_cache)

    mock_screener_df = pd.DataFrame([
        {
            "Ticker": "XYZ",
            "Company": "Test Vulnerable Co",
            "Sector": "Industrials",
            "Industry": "Airlines",
            "Market Cap": "5.5B",
            "Price": 25.40,
            "Change": "-2.1%",
            "Volume": 1500000.0,
        }
    ])

    with patch("finvizfinance.screener.overview.Overview.screener_view", return_value=mock_screener_df):
        items = service.get_macro_basket("rate_vulnerable")
        assert len(items) == 1
        assert items[0]["ticker"] == "XYZ"
        assert items[0]["company"] == "Test Vulnerable Co"
        assert items[0]["market_cap_bn"] == 5.5
        assert items[0]["price"] == 25.40


# ──────────────────────────────────────────────────────────────────────────────
# 5. Caching Layer Hygiene (15-min TTL) Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_cache_hygiene_and_ttl(temp_cache, mock_sector_perf_df, mock_sector_val_df):
    """
    CRITICAL ACCEPTANCE CRITERIA:
    Confirm that subsequent hits within 15 minutes resolve from cache without hitting FinViz.
    """
    service = FinvizMarketService(cache=temp_cache)

    with patch("finvizfinance.group.performance.Performance.screener_view", return_value=mock_sector_perf_df) as mock_perf, \
         patch("finvizfinance.group.valuation.Valuation.screener_view", return_value=mock_sector_val_df) as mock_val:

        # 1st call: Cache miss -> calls external library
        res1 = service.get_sector_rotation(force_refresh=False)
        assert mock_perf.call_count == 1
        assert mock_val.call_count == 1
        assert res1["_meta"]["cached"] is False

        # 2nd call: Within TTL -> resolves from cache, 0 external library calls!
        res2 = service.get_sector_rotation(force_refresh=False)
        assert mock_perf.call_count == 1  # Still 1!
        assert mock_val.call_count == 1   # Still 1!
        assert res2["_meta"]["cached"] is True

        # 3rd call with force_refresh=True -> bypasses cache
        res3 = service.get_sector_rotation(force_refresh=True)
        assert mock_perf.call_count == 2
        assert mock_val.call_count == 2
        assert res3["_meta"]["cached"] is False


# ──────────────────────────────────────────────────────────────────────────────
# 6. Graceful Fallback Handling Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_graceful_fallback_on_network_or_html_change(temp_cache):
    """
    CRITICAL ACCEPTANCE CRITERIA:
    Confirm that when FinViz throws exceptions (403, 429, or HTML parse error),
    the service gracefully recovers and serves deterministic fallback snapshot.
    """
    service = FinvizMarketService(cache=temp_cache)

    # Simulate network failure / 403 Forbidden
    with patch("finvizfinance.group.performance.Performance.screener_view", side_effect=Exception("403 Forbidden: Rate Limited")):
        # Should NOT raise uncaught exception
        res = service.get_sector_rotation()
        assert res is not None
        assert "sectors" in res
        assert len(res["sectors"]) == 11
        assert res["_meta"]["cached"] is True
        assert res["_meta"]["source"] == "fallback_snapshot"


# ──────────────────────────────────────────────────────────────────────────────
# 7. Helper Unit Functions
# ──────────────────────────────────────────────────────────────────────────────

def test_numeric_parsing_helpers():
    """Verify parsing utilities for market cap and percentages."""
    assert _parse_numeric_percent("5.2%") == 5.2
    assert _parse_numeric_percent("-1.25%") == -1.25
    assert _parse_numeric_percent(0.045) == 4.5  # Decimal fraction -> percentage
    assert _parse_numeric_percent(15.2) == 15.2
    assert _parse_numeric_percent(None) == 0.0

    assert _parse_market_cap("34.5B") == 34.5
    assert _parse_market_cap("2.1T") == 2100.0
    assert _parse_market_cap("500M") == 0.5
    assert _parse_market_cap(45000000000.0) == 45.0  # 45B in raw dollars


# ──────────────────────────────────────────────────────────────────────────────
# 8. FastAPI Endpoints Integration Tests
# ──────────────────────────────────────────────────────────────────────────────

def test_fastapi_endpoints(mock_sector_perf_df, mock_sector_val_df):
    """Test all FastAPI endpoints through Starlette TestClient."""
    from fastapi.testclient import TestClient
    from api.market_server import app

    client = TestClient(app)

    # Health check
    res = client.get("/api/market/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # With mocked services to avoid external scraping
    with patch("finvizfinance.group.performance.Performance.screener_view", return_value=mock_sector_perf_df), \
         patch("finvizfinance.group.valuation.Valuation.screener_view", return_value=mock_sector_val_df):

        # Sectors
        sec_res = client.get("/api/market/sectors")
        assert sec_res.status_code == 200
        assert "sectors" in sec_res.json()

        # ERP
        erp_res = client.get("/api/market/erp?ten_year_yield=4.25")
        assert erp_res.status_code == 200
        assert erp_res.json()["ten_year_yield"] == 4.25
        assert "erp" in erp_res.json()
