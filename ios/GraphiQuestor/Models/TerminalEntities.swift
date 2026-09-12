import Foundation
import SwiftData

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
    public var deltaType: String // "POSITIVE", "NEGATIVE", "NEUTRAL"
    public var category: String  // "RATES", "FX", "COMMODITY", "LIQUIDITY"
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
    public var latestFilingType: String // e.g. "8-K Item 2.04", "10-Q"
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
