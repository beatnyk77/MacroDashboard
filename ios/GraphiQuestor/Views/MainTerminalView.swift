import SwiftUI
import SwiftData

public struct MainTerminalView: View {
    @Environment(\.modelContext) private var modelContext

    @Query private var regimes: [MacroRegimeEntity]
    @Query(sort: \TickerRateEntity.orderIndex) private var tickers: [TickerRateEntity]
    @Query(sort: \EdgarDistressEntity.filedAt, order: .reverse) private var edgarItems: [EdgarDistressEntity]
    @Query(sort: \MacroMetricEntity.orderIndex) private var allMetrics: [MacroMetricEntity]
    @Query private var audioDigests: [AudioDigestMetadata]

    @State private var selectedDesk: MacroDeskType = .liquidity
    @State private var isAudioPlaying = false
    @State private var showingSearchModal = false
    @State private var showingDesksDrawer = false
    @State private var filterZombiesOnly = false

    public init() {}

    public var body: some View {
        ZStack(alignment: .bottom) {
            Color.obsidianVoid
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top Brand & Live Telemetry Header
                HStack {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.cyanVector)
                            .frame(width: 6, height: 6)

                        Text("GRAPHIQUESTOR")
                            .font(.spaceGrotesk(size: 15, weight: .bold))
                            .foregroundColor(.dataWhite)
                            .tracking(-0.3)
                    }

                    Spacer()

                    HStack(spacing: 6) {
                        Text("LIVE 74/100")
                            .font(.jetBrainsMono(size: 9, weight: .bold))
                            .foregroundColor(.emeraldNormalcy)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.emeraldNormalcy.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 3))
                            .overlay(
                                RoundedRectangle(cornerRadius: 3)
                                    .stroke(Color.emeraldNormalcy.opacity(0.3), lineWidth: 0.6)
                            )

                        Button(action: { isAudioPlaying.toggle() }) {
                            Image(systemName: isAudioPlaying ? "waveform.badge.pause" : "headphones")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.cyanVector)
                                .padding(5)
                                .background(Color.glassSurface)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(Color.hairlineBorder, lineWidth: 0.8))
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .padding(.bottom, 8)

                // Top Persistent Ticker Ribbon
                MacroTickerRibbonView(tickers: tickers.isEmpty ? previewTickers() : tickers)

                // Main Scrollable Content
                ScrollView {
                    VStack(spacing: 12) {
                        // 1. Hero Regime Gauge Card
                        HeroRegimeGaugeView(regime: regimes.first)

                        // 2. Comprehensive Macro Desks Horizontal Matrix Pills
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(MacroDeskType.allCases, id: \.self) { desk in
                                    let isSelected = selectedDesk == desk
                                    Button(action: { selectedDesk = desk }) {
                                        HStack(spacing: 4) {
                                            Text(desk.displayName)
                                                .font(.spaceGrotesk(size: 11, weight: isSelected ? .bold : .medium))
                                                .foregroundColor(isSelected ? .dataWhite : .mutedSlate)

                                            let count = countForDesk(desk)
                                            if count > 0 {
                                                Text("\(count)")
                                                    .font(.jetBrainsMono(size: 8, weight: .bold))
                                                    .foregroundColor(isSelected ? .obsidianVoid : .mutedSlate)
                                                    .padding(.horizontal, 4)
                                                    .padding(.vertical, 1)
                                                    .background(isSelected ? Color.cyanVector : Color.obsidianVoid)
                                                    .clipShape(Capsule())
                                            }
                                        }
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(isSelected ? Color.cyanVector.opacity(0.18) : Color.subSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 4))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 4)
                                                .stroke(isSelected ? Color.cyanVector : Color.hairlineBorder, lineWidth: isSelected ? 1.0 : 0.6)
                                        )
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }

                        // 3. Desk Specific Telemetry Stream
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("\(selectedDesk.displayName.uppercased()) TELEMETRY")
                                    .font(.spaceGrotesk(size: 12, weight: .bold))
                                    .foregroundColor(.dataWhite)

                                Spacer()

                                Text("\(filteredMetrics().count) VECTORS MONITORED")
                                    .font(.jetBrainsMono(size: 8, weight: .semibold))
                                    .foregroundColor(.mutedSlate)
                            }
                            .padding(.horizontal, 16)

                            // Show EDGAR distress items if on Corporate Stress Desk
                            if selectedDesk == .edgarCorporate {
                                let displayedItems = edgarItems.isEmpty ? previewEdgarDistress() : edgarItems
                                ForEach(displayedItems) { item in
                                    EdgarDistressCardView(distressItem: item)
                                }
                                .padding(.horizontal, 16)
                            }

                            // Render all institutional metrics for the active desk
                            let metricsToShow = filteredMetrics()
                            ForEach(metricsToShow) { metric in
                                InstitutionalMetricCardView(metric: metric)
                                    .padding(.horizontal, 16)
                            }
                        }

                        // Spacer for floating HUD
                        Color.clear.frame(height: 70)
                    }
                    .padding(.top, 10)
                }
            }

            // Floating Command HUD
            FloatingCommandHUDView(
                activeDistressCount: edgarItems.filter { $0.distressAlertTriggered }.count,
                isAudioPlaying: isAudioPlaying,
                onSearchTapped: { showingSearchModal = true },
                onAudioTapped: { isAudioPlaying.toggle() },
                onZombiesTapped: { selectedDesk = .edgarCorporate },
                onDesksTapped: { showingDesksDrawer = true }
            )
            .padding(.bottom, 8)
        }
        .task {
            // Background bootstrap sync
            try? await TerminalBootstrapClient.shared.fetchAndHydrate(modelContext: modelContext)
        }
    }

    private func countForDesk(_ desk: MacroDeskType) -> Int {
        let metrics = allMetrics.isEmpty ? previewAllMetrics() : allMetrics
        return metrics.filter { $0.deskType == desk }.count
    }

    private func filteredMetrics() -> [MacroMetricEntity] {
        let metrics = allMetrics.isEmpty ? previewAllMetrics() : allMetrics
        return metrics.filter { $0.deskType == selectedDesk }
    }

    // MARK: - Preview Fallbacks (All GQ Desks & Core Metrics)
    private func previewTickers() -> [TickerRateEntity] {
        return [
            TickerRateEntity(symbol: "SOFR", name: "SOFR", displayValue: "5.31%", deltaValue: "0.0 bps", deltaType: "NEUTRAL", category: "RATES", orderIndex: 1),
            TickerRateEntity(symbol: "TGA", name: "TGA", displayValue: "$812B", deltaValue: "-$38B", deltaType: "POSITIVE", category: "LIQUIDITY", orderIndex: 2),
            TickerRateEntity(symbol: "ONRRP", name: "ON RRP", displayValue: "$284B", deltaValue: "-$14B", deltaType: "POSITIVE", category: "LIQUIDITY", orderIndex: 3),
            TickerRateEntity(symbol: "DXY", name: "DXY", displayValue: "103.82", deltaValue: "-0.42%", deltaType: "POSITIVE", category: "FX", orderIndex: 4),
            TickerRateEntity(symbol: "US10Y", name: "US 10Y", displayValue: "4.28%", deltaValue: "+3.2 bps", deltaType: "NEGATIVE", category: "RATES", orderIndex: 5)
        ]
    }

    private func previewAllMetrics() -> [MacroMetricEntity] {
        return [
            // 1. LIQUIDITY DESK
            MacroMetricEntity(
                metricId: "fed_net_liquidity",
                name: "Federal Reserve Net Liquidity",
                deskType: .liquidity,
                currentValue: 6142.4,
                displayFormattedValue: "$6,142.4",
                unit: "B USD",
                deltaValue: "+$42.8B (+0.71%)",
                deltaPercent: 0.71,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "Federal Reserve Board (H.4.1)",
                observationDate: "2026-09-11",
                conceptSummary: "Total Fed assets (WALCL) minus Treasury General Account (TGA) minus Reverse Repo (ON RRP). Measures pure usable bank reserves.",
                institutionalSignificance: "Systemic risk asset tailwind. When Net Liquidity expands, equity volatility compresses and high-yield spreads tighten.",
                sparklineCSV: "6080,6095,6110,6124,6142.4",
                orderIndex: 1
            ),
            MacroMetricEntity(
                metricId: "walcl_balance_sheet",
                name: "Fed SOMA Total Assets (WALCL)",
                deskType: .liquidity,
                currentValue: 7214.0,
                displayFormattedValue: "$7,214.0",
                unit: "B USD",
                deltaValue: "-$18.2B (-0.25%)",
                deltaPercent: -0.25,
                deltaDirection: "DOWN",
                deltaSignificance: "RESTRICTIVE",
                stalenessFlag: "fresh",
                sourceName: "FRED",
                observationDate: "2026-09-11",
                conceptSummary: "Total System Open Market Account (SOMA) securities holdings under Quantitative Tightening (QT) runoff caps.",
                institutionalSignificance: "Treasury runoff cap $25B/mo and MBS cap $35B/mo continuing to contract broad central bank base money.",
                sparklineCSV: "7260,7245,7230,7222,7214",
                orderIndex: 2
            ),
            MacroMetricEntity(
                metricId: "sofr_effr_spread",
                name: "SOFR vs EFFR Funding Spread",
                deskType: .liquidity,
                currentValue: 1.2,
                displayFormattedValue: "+1.2",
                unit: "bps",
                deltaValue: "-0.4 bps",
                deltaPercent: -0.25,
                deltaDirection: "DOWN",
                deltaSignificance: "NEUTRAL",
                stalenessFlag: "fresh",
                sourceName: "Federal Reserve Bank of New York",
                observationDate: "2026-09-11",
                conceptSummary: "Secured Overnight Financing Rate spread over Effective Federal Funds Rate. Gauges collateralized vs uncollateralized interbank demand.",
                institutionalSignificance: "Normal trading band. Spikes above +5 bps signal collateral scarcity and repo clearing bottlenecks.",
                sparklineCSV: "1.8,1.6,1.4,1.3,1.2",
                orderIndex: 3
            ),

            // 2. US MACRO & SOVEREIGN DESK
            MacroMetricEntity(
                metricId: "us_2y10y_curve",
                name: "US 10Y-2Y Yield Curve Spread",
                deskType: .usMacro,
                currentValue: 18.4,
                displayFormattedValue: "+18.4",
                unit: "bps",
                deltaValue: "+4.2 bps",
                deltaPercent: 0.3,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "U.S. Department of the Treasury",
                observationDate: "2026-09-11",
                conceptSummary: "Nominal yield on 10-Year Treasury note minus 2-Year Treasury note. Traditional business cycle and recession phase transition barometer.",
                institutionalSignificance: "Bull steepening phase underway as front-end rates price easing cycles, improving banking net interest margins.",
                sparklineCSV: "8.2,11.4,14.0,16.2,18.4",
                orderIndex: 4
            ),
            MacroMetricEntity(
                metricId: "treasury_bid_to_cover",
                name: "US 10Y Auction Bid-to-Cover",
                deskType: .usMacro,
                currentValue: 2.52,
                displayFormattedValue: "2.52x",
                unit: "Ratio",
                deltaValue: "+0.14x",
                deltaPercent: 0.05,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "TreasuryDirect",
                observationDate: "2026-09-10",
                conceptSummary: "Total dollar volume of bids submitted relative to the auctioned amount in latest 10-Year Treasury note reopenings.",
                institutionalSignificance: "Above 6-month average (2.44x). Primary dealer concession was minimal, with foreign indirect bidders taking 68.4%.",
                sparklineCSV: "2.38,2.41,2.46,2.48,2.52",
                orderIndex: 5
            ),

            // 3. CHINA & EM DESK
            MacroMetricEntity(
                metricId: "china_credit_impulse",
                name: "China 12M Credit Impulse",
                deskType: .chinaAsia,
                currentValue: 24.8,
                displayFormattedValue: "24.8%",
                unit: "% GDP",
                deltaValue: "+1.4% MoM (Inflection)",
                deltaPercent: 1.4,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "People's Bank of China (PBoC)",
                observationDate: "2026-09-08",
                conceptSummary: "New Total Social Financing (TSF) credit creation rate of change scaled by nominal GDP over a 12-month rolling window.",
                institutionalSignificance: "Historical 6-month leading indicator for global commodity demand, German manufacturing PMI, and Australian mining revenue.",
                sparklineCSV: "21.2,22.0,22.8,23.4,24.8",
                orderIndex: 6
            ),
            MacroMetricEntity(
                metricId: "rbi_fx_reserves",
                name: "India Foreign Exchange Reserves",
                deskType: .chinaAsia,
                currentValue: 683.4,
                displayFormattedValue: "$683.4",
                unit: "B USD",
                deltaValue: "+$4.1B WoW",
                deltaPercent: 0.6,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "Reserve Bank of India (DBIE)",
                observationDate: "2026-09-05",
                conceptSummary: "Foreign currency assets, gold, and SDR holdings administered by the Reserve Bank of India.",
                institutionalSignificance: "Provides 11.4 months of import cover, insulating INR from dollar surge shocks and supporting RBI repo market intervention.",
                sparklineCSV: "672,676,679,681,683.4",
                orderIndex: 7
            ),

            // 4. ENERGY SECURITY DESK
            MacroMetricEntity(
                metricId: "india_crude_import_cover",
                name: "Strategic Crude Import Coverage",
                deskType: .energyCommodities,
                currentValue: 74.2,
                displayFormattedValue: "74.2",
                unit: "Days",
                deltaValue: "+2.1 Days",
                deltaPercent: 0.03,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "Ministry of Petroleum & Natural Gas / IEA",
                observationDate: "2026-09-10",
                conceptSummary: "National strategic commercial + underground salt cavern crude reserves measured against daily net consumption throughput.",
                institutionalSignificance: "Comfortably above the 60-day threshold; cushions domestic refining margins from Middle East shipping reroutes.",
                sparklineCSV: "68.4,70.1,71.8,72.9,74.2",
                orderIndex: 8
            ),
            MacroMetricEntity(
                metricId: "us_spr_inventory",
                name: "US Strategic Petroleum Reserve (SPR)",
                deskType: .energyCommodities,
                currentValue: 378.6,
                displayFormattedValue: "378.6",
                unit: "M Barrels",
                deltaValue: "+1.2M bbl WoW",
                deltaPercent: 0.003,
                deltaDirection: "UP",
                deltaSignificance: "NEUTRAL",
                stalenessFlag: "fresh",
                sourceName: "U.S. Energy Information Administration (EIA)",
                observationDate: "2026-09-09",
                conceptSummary: "Government-owned crude oil stock stored in deep underground salt domes along the Texas and Louisiana Gulf Coast.",
                institutionalSignificance: "Gradual refill pacing ($78/bbl buyback ceiling) limits downside price support for WTI futures.",
                sparklineCSV: "372,374,375.5,377.4,378.6",
                orderIndex: 9
            ),

            // 5. DE-DOLLARIZATION & GOLD DESK
            MacroMetricEntity(
                metricId: "central_bank_gold_demand",
                name: "Global Central Bank Gold Net Buying",
                deskType: .deDollarization,
                currentValue: 242.0,
                displayFormattedValue: "242.0",
                unit: "Tonnes (QTD)",
                deltaValue: "+38 Tonnes QoQ",
                deltaPercent: 0.18,
                deltaDirection: "UP",
                deltaSignificance: "STIMULATIVE",
                stalenessFlag: "fresh",
                sourceName: "World Gold Council / IMF IFS",
                observationDate: "2026-09-01",
                conceptSummary: "Net quarterly gold bullion acquisitions reported by sovereign monetary authorities (PBoC, NBH, RBI, CBR).",
                institutionalSignificance: "Structural diversification away from G7 sovereign debt reserves, establishing long-term secular floor under gold spot prices.",
                sparklineCSV: "180,195,210,224,242",
                orderIndex: 10
            ),
            MacroMetricEntity(
                metricId: "petrodollar_decay_ratio",
                name: "Non-USD Bilateral Oil Settlement Ratio",
                deskType: .deDollarization,
                currentValue: 21.4,
                displayFormattedValue: "21.4%",
                unit: "% Global Trade",
                deltaValue: "+1.8% YoY",
                deltaPercent: 0.09,
                deltaDirection: "UP",
                deltaSignificance: "WARNING",
                stalenessFlag: "fresh",
                sourceName: "SWIFT RMB Tracker & BIS",
                observationDate: "2026-08-31",
                conceptSummary: "Fraction of global seaborne crude trade invoiced and settled in alternative currencies (RMB, AED, INR, Rubles).",
                institutionalSignificance: "Secular decline in mandatory offshore Eurodollar transaction balances, eroding structural dollar reserve dominance.",
                sparklineCSV: "16.2,17.4,18.9,20.1,21.4",
                orderIndex: 11
            )
        ]
    }

    private func previewEdgarDistress() -> [EdgarDistressEntity] {
        return [
            EdgarDistressEntity(
                ticker: "TCLG",
                companyName: "Tri-Continental Logistics Corp",
                sector: "Industrial Transportation",
                altmanZScore: 1.12,
                interestCoverageRatio: 0.84,
                debtMaturityWallUSD: 650,
                maturityQuarter: "Q1 2025",
                spreadToSOFRBps: 480,
                latestFilingType: "Form 8-K Item 2.04 Triggered",
                distressAlertTriggered: true,
                filingSummary: "Credit agreement covenant breach under minimum EBITDA requirements following diesel transport surcharge compression.",
                filedAt: Date()
            ),
            EdgarDistressEntity(
                ticker: "NXHL",
                companyName: "NexHealth Systems Inc",
                sector: "Healthcare Facilities",
                altmanZScore: 1.34,
                interestCoverageRatio: 0.95,
                debtMaturityWallUSD: 420,
                maturityQuarter: "Q2 2025",
                spreadToSOFRBps: 520,
                latestFilingType: "Form 10-Q Distress Disclosure",
                distressAlertTriggered: true,
                filingSummary: "Floating rate syndicated loan interest expense surged 48% YoY, compressing operating margin into negative coverage territory.",
                filedAt: Date().addingTimeInterval(-86400)
            )
        ]
    }
}
