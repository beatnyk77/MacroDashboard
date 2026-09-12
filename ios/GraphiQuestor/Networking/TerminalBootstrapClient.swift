import Foundation
import SwiftData

// MARK: - Bootstrap DTO Payloads
public struct MobileBootstrapDTO: Codable {
    public let regime: RegimeDTO
    public let tickers: [TickerDTO]
    public let edgarDistress: [EdgarDistressDTO]
    public let audioDigest: AudioDigestDTO?
    public let generatedAt: String
}

public struct RegimeDTO: Codable {
    public let score: Int
    public let statusName: String
    public let netLiquidityDeltaUSD: Double
    public let netLiquidityDeltaWoWPercent: Double
    public let tgaDrainUSD: Double
    public let rrpBufferUSD: Double
    public let fxSwapBasisBps: Double
    public let cycleTag: String
}

public struct TickerDTO: Codable {
    public let symbol: String
    public let name: String
    public let displayValue: String
    public let deltaValue: String
    public let deltaType: String
    public let category: String
    public let orderIndex: Int
}

public struct EdgarDistressDTO: Codable {
    public let ticker: String
    public let companyName: String
    public let sector: String
    public let altmanZScore: Double
    public let interestCoverageRatio: Double
    public let debtMaturityWallUSD: Double
    public let maturityQuarter: String
    public let spreadToSOFRBps: Int
    public let latestFilingType: String
    public let distressAlertTriggered: Bool
    public let filingSummary: String
    public let filedAt: String
}

public struct AudioDigestDTO: Codable {
    public let id: String
    public let title: String
    public let episodeNumber: Int
    public let durationSeconds: Int
    public let streamURLString: String
    public let keyTakeaway1: String
    public let keyTakeaway2: String
    public let keyTakeaway3: String
    public let publishedAt: String
}

// MARK: - Network Client Actor
@globalActor
public actor NetworkActor {
    public static let shared = NetworkActor()
}

@NetworkActor
public final class TerminalBootstrapClient {
    public static let shared = TerminalBootstrapClient()

    private let defaultBaseURL = URL(string: "https://rtdaxvhykqqvubeylgtj.supabase.co/functions/v1/mobile-bootstrap")!
    private let urlSession: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 8.0
        config.timeoutIntervalForResource = 15.0
        config.requestCachePolicy = .returnCacheDataElseLoad
        self.urlSession = URLSession(configuration: config)
    }

    /// Fetches bootstrap snapshot and updates SwiftData models in background
    public func fetchAndHydrate(
        modelContext: ModelContext,
        overrideURL: URL? = nil
    ) async throws {
        let targetURL = overrideURL ?? defaultBaseURL
        var request = URLRequest(url: targetURL)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("gzip, deflate", forHTTPHeaderField: "Accept-Encoding")

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let bootstrap = try decoder.decode(MobileBootstrapDTO.self, from: data)

        // Hydrate SwiftData on main thread context safely
        await MainActor.run {
            // 1. Regime
            let regime = MacroRegimeEntity(
                score: bootstrap.regime.score,
                statusName: bootstrap.regime.statusName,
                netLiquidityDeltaUSD: bootstrap.regime.netLiquidityDeltaUSD,
                netLiquidityDeltaWoWPercent: bootstrap.regime.netLiquidityDeltaWoWPercent,
                tgaDrainUSD: bootstrap.regime.tgaDrainUSD,
                rrpBufferUSD: bootstrap.regime.rrpBufferUSD,
                fxSwapBasisBps: bootstrap.regime.fxSwapBasisBps,
                cycleTag: bootstrap.regime.cycleTag
            )
            modelContext.insert(regime)

            // 2. Tickers
            for dto in bootstrap.tickers {
                let entity = TickerRateEntity(
                    symbol: dto.symbol,
                    name: dto.name,
                    displayValue: dto.displayValue,
                    deltaValue: dto.deltaValue,
                    deltaType: dto.deltaType,
                    category: dto.category,
                    orderIndex: dto.orderIndex
                )
                modelContext.insert(entity)
            }

            // 3. EDGAR Distress
            let isoFormatter = ISO8601DateFormatter()
            for dto in bootstrap.edgarDistress {
                let filedDate = isoFormatter.date(from: dto.filedAt) ?? Date()
                let entity = EdgarDistressEntity(
                    ticker: dto.ticker,
                    companyName: dto.companyName,
                    sector: dto.sector,
                    altmanZScore: dto.altmanZScore,
                    interestCoverageRatio: dto.interestCoverageRatio,
                    debtMaturityWallUSD: dto.debtMaturityWallUSD,
                    maturityQuarter: dto.maturityQuarter,
                    spreadToSOFRBps: dto.spreadToSOFRBps,
                    latestFilingType: dto.latestFilingType,
                    distressAlertTriggered: dto.distressAlertTriggered,
                    filingSummary: dto.filingSummary,
                    filedAt: filedDate
                )
                modelContext.insert(entity)
            }

            // 4. Audio Digest
            if let audio = bootstrap.audioDigest {
                let pubDate = isoFormatter.date(from: audio.publishedAt) ?? Date()
                let entity = AudioDigestMetadata(
                    id: audio.id,
                    title: audio.title,
                    episodeNumber: audio.episodeNumber,
                    durationSeconds: audio.durationSeconds,
                    streamURLString: audio.streamURLString,
                    keyTakeaway1: audio.keyTakeaway1,
                    keyTakeaway2: audio.keyTakeaway2,
                    keyTakeaway3: audio.keyTakeaway3,
                    publishedAt: pubDate
                )
                modelContext.insert(entity)
            }

            try? modelContext.save()
        }
    }
}
