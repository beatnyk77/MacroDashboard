import Foundation
import SwiftData

// MARK: - Macro Desks
public enum MacroDeskType: String, CaseIterable, Codable {
    case liquidity = "LIQUIDITY"
    case usMacro = "US_MACRO"
    case chinaAsia = "CHINA_ASIA"
    case energyCommodities = "ENERGY"
    case deDollarization = "DE_DOLLARIZATION"
    case edgarCorporate = "CORPORATE_STRESS"
    case precedentsLabs = "PRECEDENTS_LABS"

    public var displayName: String {
        switch self {
        case .liquidity: return "⚡ Global Liquidity"
        case .usMacro: return "🏛️ US & Sovereign Risk"
        case .chinaAsia: return "🌏 China & EM Pulse"
        case .energyCommodities: return "🛢️ Energy Security"
        case .deDollarization: return "🪙 De-Dollar & Gold"
        case .edgarCorporate: return "💀 SEC EDGAR Radar"
        case .precedentsLabs: return "🔬 Precedents & Labs"
        }
    }

    public var shortTitle: String {
        switch self {
        case .liquidity: return "Liquidity"
        case .usMacro: return "Sovereign"
        case .chinaAsia: return "China/EM"
        case .energyCommodities: return "Energy"
        case .deDollarization: return "Gold/FX"
        case .edgarCorporate: return "Zombies"
        case .precedentsLabs: return "Labs"
        }
    }
}

// MARK: - Full Macro Metric Observation
@Model
public final class MacroMetricEntity {
    @Attribute(.unique) public var metricId: String
    public var name: String
    public var deskTypeRaw: String
    public var currentValue: Double
    public var displayFormattedValue: String
    public var unit: String
    public var deltaValue: String
    public var deltaPercent: Double
    public var deltaDirection: String // "UP", "DOWN", "FLAT"
    public var deltaSignificance: String // "STIMULATIVE", "RESTRICTIVE", "NEUTRAL", "STRESS"
    public var stalenessFlag: String // "fresh", "lagged", "very_lagged"
    public var sourceName: String // "FRED", "EIA", "RBI", "PBoC", "SEC EDGAR", "U.S. Treasury"
    public var observationDate: String
    public var conceptSummary: String
    public var institutionalSignificance: String
    public var sparklineCSV: String // e.g. "12.4,12.8,13.1,12.9,13.4"
    public var isPinnedToWatchlist: Bool
    public var orderIndex: Int

    public var deskType: MacroDeskType {
        MacroDeskType(rawValue: deskTypeRaw) ?? .liquidity
    }

    public init(
        metricId: String,
        name: String,
        deskType: MacroDeskType,
        currentValue: Double,
        displayFormattedValue: String,
        unit: String,
        deltaValue: String,
        deltaPercent: Double,
        deltaDirection: String,
        deltaSignificance: String,
        stalenessFlag: String,
        sourceName: String,
        observationDate: String,
        conceptSummary: String,
        institutionalSignificance: String,
        sparklineCSV: String,
        isPinnedToWatchlist: Bool = false,
        orderIndex: Int = 0
    ) {
        self.metricId = metricId
        self.name = name
        self.deskTypeRaw = deskType.rawValue
        self.currentValue = currentValue
        self.displayFormattedValue = displayFormattedValue
        self.unit = unit
        self.deltaValue = deltaValue
        self.deltaPercent = deltaPercent
        self.deltaDirection = deltaDirection
        self.deltaSignificance = deltaSignificance
        self.stalenessFlag = stalenessFlag
        self.sourceName = sourceName
        self.observationDate = observationDate
        self.conceptSummary = conceptSummary
        self.institutionalSignificance = institutionalSignificance
        self.sparklineCSV = sparklineCSV
        self.isPinnedToWatchlist = isPinnedToWatchlist
        self.orderIndex = orderIndex
    }

    public var sparklinePoints: [Double] {
        sparklineCSV.split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
    }
}

// MARK: - Macro Regime Model
@Model
public final class MacroRegimeEntity {
    @Attribute(.unique) public var id: String
    public var score: Int
    public var statusName: String
    public var netLiquidityDeltaUSD: Double
    public var netLiquidityDeltaWoWPercent: Double
    public var tgaDrainUSD: Double
    public var rrpBufferUSD: Double
    public var fxSwapBasisBps: Double
    public var cycleTag: String
    public var updatedAt: Date

    public init(
        id: String = "primary_regime",
        score: Int,
        statusName: String,
        netLiquidityDeltaUSD: Double,
        netLiquidityDeltaWoWPercent: Double,
        tgaDrainUSD: Double,
        rrpBufferUSD: Double,
        fxSwapBasisBps: Double,
        cycleTag: String = "Q3 EXPANSION CYCLE",
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.score = score
        self.statusName = statusName
        self.netLiquidityDeltaUSD = netLiquidityDeltaUSD
        self.netLiquidityDeltaWoWPercent = netLiquidityDeltaWoWPercent
        self.tgaDrainUSD = tgaDrainUSD
        self.rrpBufferUSD = rrpBufferUSD
        self.fxSwapBasisBps = fxSwapBasisBps
        self.cycleTag = cycleTag
        self.updatedAt = updatedAt
    }
}

// MARK: - Ticker Rate Coordinate
@Model
public final class TickerRateEntity {
    @Attribute(.unique) public var symbol: String
    public var name: String
    public var displayValue: String
    public var deltaValue: String
    public var deltaType: String
    public var category: String
    public var orderIndex: Int

    public init(
        symbol: String,
        name: String,
        displayValue: String,
        deltaValue: String,
        deltaType: String,
        category: String,
        orderIndex: Int
    ) {
        self.symbol = symbol
        self.name = name
        self.displayValue = displayValue
        self.deltaValue = deltaValue
        self.deltaType = deltaType
        self.category = category
        self.orderIndex = orderIndex
    }
}

// MARK: - SEC EDGAR Zombie & Distress Entity
@Model
public final class EdgarDistressEntity {
    @Attribute(.unique) public var ticker: String
    public var companyName: String
    public var sector: String
    public var altmanZScore: Double
    public var interestCoverageRatio: Double
    public var debtMaturityWallUSD: Double
    public var maturityQuarter: String
    public var spreadToSOFRBps: Int
    public var latestFilingType: String
    public var distressAlertTriggered: Bool
    public var filingSummary: String
    public var filedAt: Date

    public init(
        ticker: String,
        companyName: String,
        sector: String,
        altmanZScore: Double,
        interestCoverageRatio: Double,
        debtMaturityWallUSD: Double,
        maturityQuarter: String,
        spreadToSOFRBps: Int,
        latestFilingType: String,
        distressAlertTriggered: Bool,
        filingSummary: String,
        filedAt: Date
    ) {
        self.ticker = ticker
        self.companyName = companyName
        self.sector = sector
        self.altmanZScore = altmanZScore
        self.interestCoverageRatio = interestCoverageRatio
        self.debtMaturityWallUSD = debtMaturityWallUSD
        self.maturityQuarter = maturityQuarter
        self.spreadToSOFRBps = spreadToSOFRBps
        self.latestFilingType = latestFilingType
        self.distressAlertTriggered = distressAlertTriggered
        self.filingSummary = filingSummary
        self.filedAt = filedAt
    }
}

// MARK: - Audio Digest Metadata
@Model
public final class AudioDigestMetadata {
    @Attribute(.unique) public var id: String
    public var title: String
    public var episodeNumber: Int
    public var durationSeconds: Int
    public var streamURLString: String
    public var keyTakeaway1: String
    public var keyTakeaway2: String
    public var keyTakeaway3: String
    public var publishedAt: Date

    public init(
        id: String,
        title: String,
        episodeNumber: Int,
        durationSeconds: Int,
        streamURLString: String,
        keyTakeaway1: String,
        keyTakeaway2: String,
        keyTakeaway3: String,
        publishedAt: Date
    ) {
        self.id = id
        self.title = title
        self.episodeNumber = episodeNumber
        self.durationSeconds = durationSeconds
        self.streamURLString = streamURLString
        self.keyTakeaway1 = keyTakeaway1
        self.keyTakeaway2 = keyTakeaway2
        self.keyTakeaway3 = keyTakeaway3
        self.publishedAt = publishedAt
    }
}
