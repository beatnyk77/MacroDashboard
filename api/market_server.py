"""
Market Transmission FastAPI Server
==================================
Exposes institutional market transmission and breadth endpoints for MacroDashboard.
Proxy targets configured in Vite dev server (vite.config.ts) and Vercel/Netlify rewrites.
"""

import os
import sys
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from services.finviz_service import FinvizMarketService, default_finviz_service

app = FastAPI(
    title="GraphiQuestor Market Transmission API",
    description="Institutional Market Transmission & Breadth Layer using finvizfinance",
    version="1.0.0",
)

# CORS configuration for local Vite development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/market/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint indicating service status and cache readiness."""
    return {
        "status": "healthy",
        "service": "market_transmission",
        "library": "finvizfinance",
        "cache_engine": "sqlite+memory",
    }


@app.get("/api/market/sectors")
def get_sectors(force_refresh: bool = Query(False)) -> Dict[str, Any]:
    """
    Sector & Industry rotation telemetry across 1W, 1M, 3M, 1Y horizons.
    Includes Cyclical vs. Defensive spread and macroeconomic regime classification.
    """
    try:
        return default_finviz_service.get_sector_rotation(force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sector rotation: {str(e)}")


@app.get("/api/market/breadth")
def get_breadth(
    ten_year_yield: Optional[float] = Query(None, description="Benchmark 10Y Treasury yield for divergence checks"),
    force_refresh: bool = Query(False),
) -> Dict[str, Any]:
    """
    Market-wide technical breadth metrics:
    - % of stocks above 50-day and 200-day SMAs.
    - New 52-Week Highs vs. Lows ratio.
    - Breadth divergence alert against benchmark yield levels.
    """
    try:
        return default_finviz_service.get_market_breadth(ten_year_yield=ten_year_yield, force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market breadth: {str(e)}")


@app.get("/api/market/erp")
def get_erp(
    ten_year_yield: Optional[float] = Query(None, description="Live 10-Year Treasury Yield in percent (e.g. 4.38)"),
    force_refresh: bool = Query(False),
) -> Dict[str, Any]:
    """
    Equity Risk Premium (ERP) Calculator:
    - S&P 500 P/E and Forward P/E.
    - Forward Earnings Yield = 1 / (Forward P/E).
    - ERP = Forward Earnings Yield - 10Y Treasury Yield.
    - Valuation posture: Extremely Attractive / Neutral / Stretched / High Risk.
    """
    try:
        return default_finviz_service.get_equity_risk_premium(ten_year_yield=ten_year_yield, force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute ERP: {str(e)}")


@app.get("/api/market/baskets")
def get_baskets(
    basket_type: str = Query("rate_vulnerable", description="'rate_vulnerable' or 'pricing_power'"),
    limit: int = Query(15, ge=1, le=50),
    force_refresh: bool = Query(False),
) -> Dict[str, Any]:
    """
    Macro-sensitive equity screeners:
    - Rate-Vulnerable Basket (high leverage, low quick ratio, negative quarterly growth).
    - Pricing Power Basket (gross margin > 50%, operating margin > 20%, ROE > 15%).
    """
    try:
        items = default_finviz_service.get_macro_basket(basket_type=basket_type, limit=limit, force_refresh=force_refresh)
        return {
            "basket_type": basket_type,
            "count": len(items),
            "items": items,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run macro screener: {str(e)}")


@app.get("/api/market/overview")
def get_overview(
    ten_year_yield: Optional[float] = Query(None, description="Optional override for 10Y yield"),
    force_refresh: bool = Query(False),
) -> Dict[str, Any]:
    """
    Unified market transmission snapshot for single-call dashboard hydration.
    Returns sectors, breadth, ERP, and top macro baskets.
    """
    try:
        return default_finviz_service.get_market_overview(ten_year_yield=ten_year_yield, force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market overview: {str(e)}")


@app.post("/api/market/refresh")
def force_refresh_all() -> Dict[str, Any]:
    """Force flush cache and execute live scrape refresh."""
    try:
        default_finviz_service.cache.clear()
        data = default_finviz_service.get_market_overview(force_refresh=True)
        return {"status": "refreshed", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cache refresh failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.market_server:app", host="0.0.0.0", port=8000, reload=True)
