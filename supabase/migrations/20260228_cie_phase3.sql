-- Phase 3 CIE Enhancements: Alerts and Saved Views
-- Date: 2026-02-28

-- 1. Alerts Table
CREATE TABLE IF NOT EXISTS public.cie_alerts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'macro', 'fundamental', 'oil', etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Saved Views Table
CREATE TABLE IF NOT EXISTS public.cie_saved_views (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cie_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_saved_views ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own alerts') THEN
        CREATE POLICY "Users can manage their own alerts" ON public.cie_alerts FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own saved views') THEN
        CREATE POLICY "Users can manage their own saved views" ON public.cie_saved_views FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Updated At Trigger for Saved Views
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_saved_views_updated_at') THEN
        CREATE TRIGGER update_cie_saved_views_updated_at BEFORE UPDATE ON public.cie_saved_views FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- Add missing columns to cie_macro_signals if needed
ALTER TABLE public.cie_macro_signals ADD COLUMN IF NOT EXISTS capex_efficiency NUMERIC;
