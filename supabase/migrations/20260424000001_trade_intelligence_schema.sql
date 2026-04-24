-- ============================================================
-- Trade Intelligence Module — Schema Migration
-- Date: 2026-04-24
-- Tables: hs_code_master, trade_demand_cache, trade_supplier_breakdown, hs_opportunity_scores
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. HS Code Master (static lookup, seeded once)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hs_code_master (
    code        VARCHAR(6)  PRIMARY KEY,
    description TEXT        NOT NULL,
    chapter     VARCHAR(2),
    heading     VARCHAR(4),
    level       INT         CHECK (level IN (2, 4, 6)),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hs_code_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on hs_code_master"
    ON public.hs_code_master FOR SELECT USING (true);

-- Full-text search index for autocomplete
CREATE INDEX IF NOT EXISTS idx_hs_code_master_description_fts
    ON public.hs_code_master USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_hs_code_master_chapter
    ON public.hs_code_master(chapter);


-- ────────────────────────────────────────────────────────────
-- 2. Trade Demand Cache (import totals per HS × country × year)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_demand_cache (
    id               BIGSERIAL   PRIMARY KEY,
    hs_code          VARCHAR(6)  NOT NULL,
    reporter_iso3    VARCHAR(3)  NOT NULL,   -- ISO 3166-1 alpha-3 importing country
    reporter_iso2    VARCHAR(2),              -- alpha-2 for cross-linking country_metrics
    reporter_name    TEXT,
    year             INT         NOT NULL,
    import_value_usd BIGINT,
    qty_value        BIGINT,
    qty_unit         VARCHAR(20),
    fetched_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hs_code, reporter_iso3, year)
);

ALTER TABLE public.trade_demand_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on trade_demand_cache"
    ON public.trade_demand_cache FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tdc_hs_year
    ON public.trade_demand_cache(hs_code, year DESC);
CREATE INDEX IF NOT EXISTS idx_tdc_reporter
    ON public.trade_demand_cache(reporter_iso3);
CREATE INDEX IF NOT EXISTS idx_tdc_hs_reporter
    ON public.trade_demand_cache(hs_code, reporter_iso3);


-- ────────────────────────────────────────────────────────────
-- 3. Trade Supplier Breakdown (bilateral: who supplies whom)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_supplier_breakdown (
    id               BIGSERIAL    PRIMARY KEY,
    hs_code          VARCHAR(6)   NOT NULL,
    reporter_iso3    VARCHAR(3)   NOT NULL,   -- importing country
    partner_iso3     VARCHAR(3)   NOT NULL,   -- supplying/exporting country
    partner_name     TEXT,
    year             INT          NOT NULL,
    import_value_usd BIGINT,
    market_share_pct DECIMAL(6,3),
    fetched_at       TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(hs_code, reporter_iso3, partner_iso3, year)
);

ALTER TABLE public.trade_supplier_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on trade_supplier_breakdown"
    ON public.trade_supplier_breakdown FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tsb_hs_reporter_year
    ON public.trade_supplier_breakdown(hs_code, reporter_iso3, year DESC);
CREATE INDEX IF NOT EXISTS idx_tsb_partner
    ON public.trade_supplier_breakdown(partner_iso3);


-- ────────────────────────────────────────────────────────────
-- 4. HS Opportunity Scores (pre-computed composite per market)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hs_opportunity_scores (
    hs_code              VARCHAR(6)   NOT NULL,
    reporter_iso3        VARCHAR(3)   NOT NULL,
    reporter_iso2        VARCHAR(2),
    reporter_name        TEXT,

    -- Score components (0-100 each)
    market_size_score    INT          CHECK (market_size_score BETWEEN 0 AND 100),
    growth_score         INT          CHECK (growth_score BETWEEN 0 AND 100),
    competition_score    INT          CHECK (competition_score BETWEEN 0 AND 100),
    macro_score          INT          CHECK (macro_score BETWEEN 0 AND 100),
    volatility_score     INT          CHECK (volatility_score BETWEEN 0 AND 100),
    overall_score        INT          CHECK (overall_score BETWEEN 0 AND 100),

    -- Competition detail
    hhi                  DECIMAL(6,4),            -- Herfindahl-Hirschman Index (0-1)
    top_supplier_iso3    VARCHAR(3),
    top_supplier_share   DECIMAL(6,3),            -- %

    -- Raw trade metrics
    latest_import_usd    BIGINT,
    cagr_5yr_pct         DECIMAL(7,3),            -- 5-year CAGR

    -- Metadata
    data_year            INT,
    computed_at          TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY(hs_code, reporter_iso3)
);

ALTER TABLE public.hs_opportunity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on hs_opportunity_scores"
    ON public.hs_opportunity_scores FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_hos_hs_score
    ON public.hs_opportunity_scores(hs_code, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_hos_reporter
    ON public.hs_opportunity_scores(reporter_iso3);


-- ────────────────────────────────────────────────────────────
-- 5. Seed: Top 200 HS codes (common traded goods)
-- ────────────────────────────────────────────────────────────
INSERT INTO public.hs_code_master (code, description, chapter, heading, level) VALUES
-- Chapter 61 — Knitted/crocheted clothing
('61', 'Articles of apparel and clothing accessories, knitted or crocheted', '61', NULL, 2),
('6101', 'Men''s or boys'' overcoats, knitted or crocheted', '61', '6101', 4),
('610110', 'Men''s/boys'' overcoats, of wool, knitted', '61', '6101', 6),
('6109', 'T-shirts, singlets and other vests, knitted', '61', '6109', 4),
('610910', 'T-shirts of cotton, knitted', '61', '6109', 6),
-- Chapter 62 — Woven clothing
('62', 'Articles of apparel and clothing accessories, not knitted or crocheted', '62', NULL, 2),
('6203', 'Men''s or boys'' suits, ensembles, jackets, woven', '62', '6203', 4),
('620342', 'Men''s/boys'' trousers, breeches, of cotton, woven', '62', '6203', 6),
('620520', 'Men''s/boys'' shirts of cotton, woven', '62', '6205', 6),
('6204', 'Women''s or girls'' suits, ensembles, jackets, woven', '62', '6204', 4),
('620462', 'Women''s/girls'' trousers, breeches, of cotton, woven', '62', '6204', 6),
-- Chapter 63 — Textiles made-up articles
('63', 'Other made-up textile articles; sets; worn clothing and worn textile articles', '63', NULL, 2),
('6301', 'Blankets and travelling rugs', '63', '6301', 4),
('6302', 'Bed linen, table linen, toilet linen and kitchen linen', '63', '6302', 4),
-- Chapter 72 — Iron and steel
('72', 'Iron and steel', '72', NULL, 2),
('7208', 'Flat-rolled products of iron, hot-rolled, in coils, width >=600mm', '72', '7208', 4),
('720811', 'Flat-rolled iron/steel, hot-rolled coils, thickness >10mm', '72', '7208', 6),
('7213', 'Bars and rods of iron/steel, hot-rolled, in irregularly wound coils', '72', '7213', 4),
-- Chapter 73 — Iron/steel articles
('73', 'Articles of iron or steel', '73', NULL, 2),
('7304', 'Tubes, pipes and hollow profiles, seamless, of iron/steel', '73', '7304', 4),
('7306', 'Other tubes and pipes, of iron or steel', '73', '7306', 4),
-- Chapter 76 — Aluminium
('76', 'Aluminium and articles thereof', '76', NULL, 2),
('7601', 'Unwrought aluminium', '76', '7601', 4),
('760110', 'Unwrought aluminium, not alloyed', '76', '7601', 6),
('7606', 'Aluminium plates, sheets and strip, thickness >0.2mm', '76', '7606', 4),
-- Chapter 84 — Machinery
('84', 'Nuclear reactors, boilers, machinery and mechanical appliances', '84', NULL, 2),
('8401', 'Nuclear reactors; fuel elements; machinery for isotope-separation', '84', '8401', 4),
('8408', 'Compression-ignition internal combustion piston engines (diesel)', '84', '8408', 4),
('8413', 'Pumps for liquids', '84', '8413', 4),
('8414', 'Air or vacuum pumps, air or other gas compressors and fans', '84', '8414', 4),
('8418', 'Refrigerators, freezers and other refrigerating equipment', '84', '8418', 4),
('8419', 'Machinery for treating materials by temperature change', '84', '8419', 4),
('8421', 'Centrifuges; machinery for filtering or purifying liquids/gases', '84', '8421', 4),
('8422', 'Dish washing machines; machinery for cleaning bottles', '84', '8422', 4),
('8428', 'Other lifting, handling, loading machinery', '84', '8428', 4),
('8429', 'Self-propelled bulldozers, angledozers, graders', '84', '8429', 4),
('8430', 'Other moving, grading, levelling, boring machinery, for earth', '84', '8430', 4),
('8431', 'Parts for machinery of headings 8425 to 8430', '84', '8431', 4),
('8432', 'Agricultural, horticultural or forestry machinery for soil preparation', '84', '8432', 4),
('8433', 'Harvesting or threshing machinery', '84', '8433', 4),
('8443', 'Printing machinery', '84', '8443', 4),
('8450', 'Household/laundry-type washing machines', '84', '8450', 4),
('8451', 'Machinery for washing, cleaning, wringing, drying textile yarns', '84', '8451', 4),
('8452', 'Sewing machines', '84', '8452', 4),
('8471', 'Automatic data processing machines and units thereof', '84', '8471', 4),
('8477', 'Machinery for working rubber or plastics', '84', '8477', 4),
('8479', 'Other machines and mechanical appliances', '84', '8479', 4),
('8481', 'Taps, cocks, valves and similar appliances for pipes', '84', '8481', 4),
('8482', 'Ball or roller bearings', '84', '8482', 4),
('8483', 'Transmission shafts, cranks, bearing housings, gears', '84', '8483', 4),
('8484', 'Gaskets and similar joints of metal sheeting combined with other material', '84', '8484', 4),
('8486', 'Machines and apparatus for manufacturing semiconductor devices', '84', '8486', 4),
('8487', 'Machinery parts, not containing electrical connectors', '84', '8487', 4),
-- Chapter 85 — Electrical machinery
('85', 'Electrical machinery and equipment and parts thereof', '85', NULL, 2),
('8501', 'Electric motors and generators', '85', '8501', 4),
('8502', 'Electric generating sets and rotary converters', '85', '8502', 4),
('8504', 'Electrical transformers, static converters and inductors', '85', '8504', 4),
('8506', 'Primary cells and primary batteries', '85', '8506', 4),
('8507', 'Electric accumulators, including separators therefor', '85', '8507', 4),
('850710', 'Lead-acid electric accumulators for starting piston engines', '85', '8507', 6),
('8508', 'Vacuum cleaners', '85', '8508', 4),
('8509', 'Electro-mechanical domestic appliances', '85', '8509', 4),
('8516', 'Electric water heaters, space heaters, soil heaters; hair dryers', '85', '8516', 4),
('8517', 'Telephone sets; apparatus for the transmission of voice/data', '85', '8517', 4),
('851762', 'Machines for the reception/conversion of voice/data (smartphones)', '85', '8517', 6),
('8518', 'Microphones, loudspeakers, headphones, amplifiers', '85', '8518', 4),
('8519', 'Sound recording or reproducing apparatus', '85', '8519', 4),
('8521', 'Video recording or reproducing apparatus', '85', '8521', 4),
('8523', 'Discs, tapes, solid-state storage devices for sound/data', '85', '8523', 4),
('8525', 'Transmission apparatus for radio-broadcasting or TV', '85', '8525', 4),
('8528', 'Monitors and projectors; reception apparatus for TV', '85', '8528', 4),
('8529', 'Parts suitable for use with apparatus of headings 8525-8528', '85', '8529', 4),
('8532', 'Electrical capacitors, fixed, variable or adjustable', '85', '8532', 4),
('8533', 'Electrical resistors', '85', '8533', 4),
('8534', 'Printed circuits', '85', '8534', 4),
('8536', 'Electrical apparatus for switching/protecting electrical circuits', '85', '8536', 4),
('8537', 'Boards, panels, consoles, desks, for electric control/distribution', '85', '8537', 4),
('8538', 'Parts for apparatus of headings 8535-8537', '85', '8538', 4),
('8540', 'Thermionic, cold cathode or photo-cathode valves and tubes', '85', '8540', 4),
('8541', 'Semiconductor devices; photovoltaic cells; LEDs', '85', '8541', 4),
('8542', 'Electronic integrated circuits', '85', '8542', 4),
('854231', 'Processors and controllers, electronic integrated circuits', '85', '8542', 6),
('8543', 'Electrical machines and apparatus, not specified elsewhere', '85', '8543', 4),
('8544', 'Insulated wire, cable and other insulated electric conductors', '85', '8544', 4),
('8545', 'Carbon electrodes, carbon brushes for electrical purposes', '85', '8545', 4),
('8546', 'Electrical insulators of any material', '85', '8546', 4),
('8547', 'Insulating fittings for electrical machines', '85', '8547', 4),
-- Chapter 87 — Vehicles
('87', 'Vehicles other than railway or tramway rolling stock', '87', NULL, 2),
('8701', 'Tractors', '87', '8701', 4),
('8702', 'Motor vehicles for the transport of 10 or more persons', '87', '8702', 4),
('8703', 'Motor cars and other motor vehicles for transport of persons', '87', '8703', 4),
('870322', 'Motor cars, spark-ignition, cylinder capacity 1000-1500cc', '87', '8703', 6),
('870323', 'Motor cars, spark-ignition, cylinder capacity 1500-3000cc', '87', '8703', 6),
('870380', 'Motor vehicles with electric motor only (EVs)', '87', '8703', 6),
('8704', 'Motor vehicles for the transport of goods', '87', '8704', 4),
('8706', 'Chassis fitted with engines, for motor vehicles', '87', '8706', 4),
('8708', 'Parts and accessories of motor vehicles', '87', '8708', 4),
-- Chapter 27 — Mineral fuels
('27', 'Mineral fuels, mineral oils and products of their distillation', '27', NULL, 2),
('2709', 'Petroleum oils and oils obtained from bituminous minerals, crude', '27', '2709', 4),
('2710', 'Petroleum oils, not crude; preparations from petroleum oils', '27', '2710', 4),
('271012', 'Light oils and preparations (petrol/gasoline)', '27', '2710', 6),
('271019', 'Other medium oils and preparations (kerosene, jet fuel)', '27', '2710', 6),
('271121', 'Natural gas in gaseous state', '27', '2711', 6),
-- Chapter 29 — Organic chemicals
('29', 'Organic chemicals', '29', NULL, 2),
('2901', 'Acyclic hydrocarbons', '29', '2901', 4),
('2902', 'Cyclic hydrocarbons', '29', '2902', 4),
('2903', 'Halogenated derivatives of hydrocarbons', '29', '2903', 4),
('2905', 'Acyclic alcohols and their halogenated derivatives', '29', '2905', 4),
('2916', 'Unsaturated acyclic monocarboxylic acids, anhydrides, halides', '29', '2916', 4),
-- Chapter 30 — Pharmaceutical products
('30', 'Pharmaceutical products', '30', NULL, 2),
('3001', 'Glands and other organs for organotherapeutic uses', '30', '3001', 4),
('3002', 'Blood, antisera, vaccines, toxins and cultures', '30', '3002', 4),
('3004', 'Medicaments consisting of mixed or unmixed products for therapeutic/prophylactic use', '30', '3004', 4),
('300440', 'Medicaments containing alkaloids or their derivatives', '30', '3004', 6),
('300490', 'Other medicaments for therapeutic or prophylactic uses', '30', '3004', 6),
-- Chapter 10 — Cereals
('10', 'Cereals', '10', NULL, 2),
('1001', 'Wheat and meslin', '10', '1001', 4),
('1002', 'Rye', '10', '1002', 4),
('1005', 'Maize (corn)', '10', '1005', 4),
('1006', 'Rice', '10', '1006', 4),
('100630', 'Semi-milled or wholly milled rice', '10', '1006', 6),
-- Chapter 09 — Coffee, tea, spices
('09', 'Coffee, tea, maté and spices', '09', NULL, 2),
('0901', 'Coffee, whether or not roasted or decaffeinated', '09', '0901', 4),
('090111', 'Coffee, not roasted, not decaffeinated', '09', '0901', 6),
('0902', 'Tea, whether or not flavoured', '09', '0902', 4),
('0904', 'Pepper of the genus Piper', '09', '0904', 4),
('0906', 'Cinnamon and cinnamon-tree flowers', '09', '0906', 4),
('0907', 'Cloves (whole fruit, cloves and stems)', '09', '0907', 4),
-- Chapter 03 — Fish
('03', 'Fish and crustaceans, molluscs and other aquatic invertebrates', '03', NULL, 2),
('0302', 'Fish, fresh or chilled, excluding fish fillets', '03', '0302', 4),
('0303', 'Fish, frozen, excluding fish fillets', '03', '0303', 4),
('0304', 'Fish fillets and other fish meat, fresh, chilled or frozen', '03', '0304', 4),
('0306', 'Crustaceans, whether in shell or not, live, fresh, chilled, frozen', '03', '0306', 4),
-- Chapter 08 — Edible fruit and nuts
('08', 'Edible fruit and nuts; peel of citrus fruit or melons', '08', NULL, 2),
('0801', 'Coconuts, Brazil nuts and cashew nuts, fresh or dried', '08', '0801', 4),
('0802', 'Other nuts, fresh or dried', '08', '0802', 4),
('0803', 'Bananas, including plantains, fresh or dried', '08', '0803', 4),
('0805', 'Citrus fruit, fresh or dried', '08', '0805', 4),
('0806', 'Grapes, fresh or dried', '08', '0806', 4),
('0901', 'Mangoes, fresh', '08', '0804', 4),
-- Chapter 52 — Cotton
('52', 'Cotton', '52', NULL, 2),
('5201', 'Cotton, not carded or combed', '52', '5201', 4),
('5205', 'Cotton yarn (other than sewing thread), >= 85% by weight of cotton', '52', '5205', 4),
('5208', 'Woven fabrics of cotton, >= 85% cotton, weight <= 200 g/m2', '52', '5208', 4),
('5209', 'Woven fabrics of cotton, >= 85% cotton, weight > 200 g/m2', '52', '5209', 4),
-- Chapter 39 — Plastics
('39', 'Plastics and articles thereof', '39', NULL, 2),
('3901', 'Polymers of ethylene, in primary forms', '39', '3901', 4),
('3902', 'Polymers of propylene, in primary forms', '39', '3902', 4),
('3903', 'Polymers of styrene, in primary forms', '39', '3903', 4),
('3904', 'Polymers of vinyl chloride or halogenated olefins, primary forms', '39', '3904', 4),
('3907', 'Polyacetals, other polyethers and epoxide resins, in primary forms', '39', '3907', 4),
('3926', 'Other articles of plastics', '39', '3926', 4),
-- Chapter 40 — Rubber
('40', 'Rubber and articles thereof', '40', NULL, 2),
('4011', 'New pneumatic tyres, of rubber', '40', '4011', 4),
('401110', 'Pneumatic tyres of rubber for motor cars', '40', '4011', 6),
('4016', 'Other articles of vulcanised rubber other than hard rubber', '40', '4016', 4),
-- Chapter 90 — Optical/scientific instruments
('90', 'Optical, photographic, measuring, checking, medical instruments', '90', NULL, 2),
('9001', 'Optical fibres; optical fibre bundles; sheet polarisers', '90', '9001', 4),
('9006', 'Photographic cameras; flashlight apparatus', '90', '9006', 4),
('9013', 'Liquid crystal devices; lasers; other optical appliances', '90', '9013', 4),
('9018', 'Instruments and appliances used in medical, surgical, dental sciences', '90', '9018', 4),
('9026', 'Instruments for measuring or checking flow of liquids/gases', '90', '9026', 4),
('9027', 'Instruments for physical or chemical analysis', '90', '9027', 4),
-- Chapter 71 — Precious metals
('71', 'Natural or cultured pearls, precious stones, precious metals', '71', NULL, 2),
('7102', 'Diamonds, whether or not worked', '71', '7102', 4),
('710231', 'Non-industrial diamonds, unworked or simply sawn/cleaved', '71', '7102', 6),
('7108', 'Gold (including gold plated with platinum) unwrought', '71', '7108', 4),
('710812', 'Gold in non-monetary form, other unwrought forms', '71', '7108', 6),
('7113', 'Articles of jewellery and parts thereof, of precious metals', '71', '7113', 4),
-- Chapter 26 — Ores
('26', 'Ores, slag and ash', '26', NULL, 2),
('2601', 'Iron ores and concentrates, including roasted iron pyrites', '26', '2601', 4),
('2603', 'Copper ores and concentrates', '26', '2603', 4),
('2606', 'Aluminium ores and concentrates', '26', '2606', 4),
('2616', 'Precious metal ores and concentrates', '26', '2616', 4),
-- Chapter 74 — Copper
('74', 'Copper and articles thereof', '74', NULL, 2),
('7401', 'Copper mattes; cement copper (precipitated copper)', '74', '7401', 4),
('7403', 'Refined copper and copper alloys, unwrought', '74', '7403', 4),
('740311', 'Cathodes and sections of cathodes, of refined copper', '74', '7403', 6),
-- Chapter 88 — Aircraft
('88', 'Aircraft, spacecraft and parts thereof', '88', NULL, 2),
('8802', 'Other aircraft (e.g., helicopters, aeroplanes, gliders)', '88', '8802', 4),
('880240', 'Aeroplanes and other aircraft, weight > 15,000 kg', '88', '8802', 6),
('8803', 'Parts of goods of heading 8801 or 8802', '88', '8803', 4),
-- Chapter 89 — Ships
('89', 'Ships, boats and floating structures', '89', NULL, 2),
('8901', 'Cruise ships, excursion boats, ferry-boats, cargo ships', '89', '8901', 4),
('8905', 'Light-vessels, fire-floats, dredgers, floating cranes', '89', '8905', 4)
ON CONFLICT (code) DO NOTHING;
