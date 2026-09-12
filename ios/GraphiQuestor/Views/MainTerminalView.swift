import SwiftUI
import SwiftData

public struct MainTerminalView: View {
    @Environment(\.modelContext) private var modelContext

    @Query private var regimes: [MacroRegimeEntity]
    @Query(sort: \TickerRateEntity.orderIndex) private var tickers: [TickerRateEntity]
    @Query(sort: \EdgarDistressEntity.filedAt, order: .reverse) private var edgarItems: [EdgarDistressEntity]
    @Query private var audioDigests: [AudioDigestMetadata]

    @State private var selectedDeskCategory = "⚡ Liquidity Stream"
    @State private var isAudioPlaying = false
    @State private var showingSearchModal = false
    @State private var showingDesksDrawer = false
    @State private var filterZombiesOnly = false

    private let deskCategories = [
        "⚡ Liquidity Stream",
        "🏛️ Central Banks",
        "💀 SEC EDGAR Zombies",
        "⚡ Energy Security",
        "📊 Cross-Asset Vol"
    ]

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

                        // 2. Horizontal Desk Selector Pills
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(deskCategories, id: \.self) { desk in
                                    let isSelected = selectedDeskCategory == desk
                                    Button(action: { selectedDeskCategory = desk }) {
                                        Text(desk)
                                            .font(.spaceGrotesk(size: 11, weight: isSelected ? .bold : .medium))
                                            .foregroundColor(isSelected ? .dataWhite : .mutedSlate)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 5)
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

                        // 3. SEC EDGAR Zombie Distress Stream Section
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("SEC EDGAR STRESS RADAR")
                                    .font(.spaceGrotesk(size: 12, weight: .bold))
                                    .foregroundColor(.dataWhite)

                                Spacer()

                                Text("\(edgarItems.count) MONITORED")
                                    .font(.jetBrainsMono(size: 8, weight: .semibold))
                                    .foregroundColor(.mutedSlate)
                            }
                            .padding(.horizontal, 4)

                            let displayedItems = edgarItems.isEmpty ? previewEdgarDistress() : edgarItems
                            ForEach(displayedItems) { item in
                                EdgarDistressCardView(distressItem: item)
                            }
                        }
                        .padding(.horizontal, 16)

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
                onZombiesTapped: { filterZombiesOnly.toggle() },
                onDesksTapped: { showingDesksDrawer = true }
            )
            .padding(.bottom, 8)
        }
        .task {
            // Background bootstrap sync
            try? await TerminalBootstrapClient.shared.fetchAndHydrate(modelContext: modelContext)
        }
    }

    // MARK: - Preview Fallbacks
    private func previewTickers() -> [TickerRateEntity] {
        return [
            TickerRateEntity(symbol: "SOFR", name: "SOFR", displayValue: "5.31%", deltaValue: "0.0 bps", deltaType: "NEUTRAL", category: "RATES", orderIndex: 1),
            TickerRateEntity(symbol: "TGA", name: "TGA", displayValue: "$812B", deltaValue: "-$38B", deltaType: "POSITIVE", category: "LIQUIDITY", orderIndex: 2),
            TickerRateEntity(symbol: "ONRRP", name: "ON RRP", displayValue: "$284B", deltaValue: "-$14B", deltaType: "POSITIVE", category: "LIQUIDITY", orderIndex: 3),
            TickerRateEntity(symbol: "DXY", name: "DXY", displayValue: "103.82", deltaValue: "-0.42%", deltaType: "POSITIVE", category: "FX", orderIndex: 4),
            TickerRateEntity(symbol: "US10Y", name: "US 10Y", displayValue: "4.28%", deltaValue: "+3.2 bps", deltaType: "NEGATIVE", category: "RATES", orderIndex: 5)
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
