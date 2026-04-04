-- =====================================================
-- Migration: Add missing columns to us_debt_maturities
-- =====================================================
-- Ensures all required columns exist for the ingestion function.
-- Adds columns only if they are missing to avoid errors.
-- =====================================================

ALTER TABLE public.us_debt_maturities
    ADD COLUMN IF NOT EXISTS tbill_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tbill_avg_yield NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS low_cost_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS medium_cost_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS high_cost_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_debt NUMERIC NOT NULL DEFAULT 0;
