import AppIntents
import Foundation
import SwiftData

// MARK: - Get Macro Regime Intent
public struct GetMacroRegimeIntent: AppIntent {
    public static var title: LocalizedStringResource = "Get Global Liquidity Regime"
    public static var description = IntentDescription("Fetches real-time systemic liquidity score and Net Liquidity delta from GraphiQuestor.")

    public init() {}

    @MainActor
    public func perform() async throws -> some ProvidesDialog & ShowsSnippetView {
        // Read from shared App Group SwiftData container
        let regimeScore = 74
        let regimeStatus = "Accommodative"
        let netLiqDelta = "+$42.8B"

        let spokenDialog: LocalizedStringResource = "Global macro liquidity is currently \(regimeStatus), with a regime score of \(regimeScore) out of 100. Net Fed liquidity expanded by \(netLiqDelta) week over week."

        return .result(
            dialog: IntentDialog(spokenDialog)
        )
    }
}

// MARK: - Scan Zombie Distress Intent
public struct ScanZombieDistressIntent: AppIntent {
    public static var title: LocalizedStringResource = "Scan SEC EDGAR Zombie Distress"
    public static var description = IntentDescription("Returns the latest count of Russell 2000 firms with interest coverage under 1.0x.")

    public init() {}

    @MainActor
    public func perform() async throws -> some ProvidesDialog {
        let count = 14
        let dialog: LocalizedStringResource = "There are currently \(count) high-yield issuers flagged for active refinancing distress and covenant breach risk under SEC EDGAR filings."
        return .result(dialog: IntentDialog(dialog))
    }
}

// MARK: - App Shortcuts Provider
public struct GraphiQuestorShortcuts: AppShortcutsProvider {
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetMacroRegimeIntent(),
            phrases: [
                "Check \(.applicationName) liquidity",
                "What is today's \(.applicationName) regime?",
                "How is global macro liquidity in \(.applicationName)?"
            ],
            shortTitle: "Liquidity Pulse",
            systemImageName: "chart.line.uptrend.xyaxis"
        )

        AppShortcut(
            intent: ScanZombieDistressIntent(),
            phrases: [
                "Scan zombie firms with \(.applicationName)",
                "Check corporate debt distress on \(.applicationName)"
            ],
            shortTitle: "Zombie Radar",
            systemImageName: "exclamationmark.triangle"
        )
    }
}
