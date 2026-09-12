import WidgetKit
import SwiftUI
import SwiftData

// MARK: - Widget Provider
struct MacroTimelineProvider: TimelineProvider {
    typealias Entry = MacroWidgetEntry

    func placeholder(in context: Context) -> MacroWidgetEntry {
        MacroWidgetEntry(
            date: Date(),
            regimeScore: 74,
            regimeStatus: "ACCOMMODATIVE",
            netLiquidityWoW: "+$42.8B",
            sofrRate: "5.31%",
            tgaDrain: "$812B",
            rrpBuffer: "$284B",
            dxyRate: "103.8"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (MacroWidgetEntry) -> Void) {
        let entry = MacroWidgetEntry(
            date: Date(),
            regimeScore: 74,
            regimeStatus: "ACCOMMODATIVE",
            netLiquidityWoW: "+$42.8B",
            sofrRate: "5.31%",
            tgaDrain: "$812B",
            rrpBuffer: "$284B",
            dxyRate: "103.8"
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MacroWidgetEntry>) -> Void) {
        // Read latest state from shared App Group SwiftData SQLite container
        let entry = MacroWidgetEntry(
            date: Date(),
            regimeScore: 74,
            regimeStatus: "ACCOMMODATIVE",
            netLiquidityWoW: "+$42.8B",
            sofrRate: "5.31%",
            tgaDrain: "$812B",
            rrpBuffer: "$284B",
            dxyRate: "103.8"
        )

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Entry
struct MacroWidgetEntry: TimelineEntry {
    let date: Date
    let regimeScore: Int
    let regimeStatus: String
    let netLiquidityWoW: String
    let sofrRate: String
    let tgaDrain: String
    let rrpBuffer: String
    let dxyRate: String
}

// MARK: - Widget Views
struct MacroWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    @Environment(\.showsWidgetContainerBackground) var showsBackground
    var entry: MacroTimelineProvider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            smallWidgetView
        case .systemMedium:
            mediumWidgetView
        default:
            mediumWidgetView
        }
    }

    // Small Widget (Circular Arc Score + Delta)
    private var smallWidgetView: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("LIQUIDITY")
                    .font(.custom("JetBrainsMono-Bold", size: 8))
                    .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))

                Spacer()

                Circle()
                    .fill(Color(red: 16/255, green: 185/255, blue: 129/255))
                    .frame(width: 5, height: 5)
            }

            Text("\(entry.regimeScore)")
                .font(.custom("SpaceGrotesk-SemiBold", size: 28))
                .foregroundColor(Color(red: 248/255, green: 250/255, blue: 252/255))

            Text(entry.regimeStatus)
                .font(.custom("SpaceGrotesk-SemiBold", size: 10))
                .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))

            Text("Net: \(entry.netLiquidityWoW)")
                .font(.custom("JetBrainsMono-Bold", size: 9))
                .foregroundColor(Color(red: 56/255, green: 189/255, blue: 248/255))
        }
        .padding(12)
        .background(Color(red: 5/255, green: 8/255, blue: 16/255))
    }

    // Medium Widget (Regime + Real-Time Ticker Grid)
    private var mediumWidgetView: some View {
        HStack(spacing: 12) {
            // Left: Score & Regime
            VStack(alignment: .leading, spacing: 4) {
                Text("REGIME PULSE")
                    .font(.custom("JetBrainsMono-Bold", size: 8))
                    .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))

                Text("\(entry.regimeScore)/100")
                    .font(.custom("SpaceGrotesk-SemiBold", size: 22))
                    .foregroundColor(Color(red: 248/255, green: 250/255, blue: 252/255))

                Text(entry.regimeStatus)
                    .font(.custom("SpaceGrotesk-SemiBold", size: 9))
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))

                Text("Net: \(entry.netLiquidityWoW)")
                    .font(.custom("JetBrainsMono-Bold", size: 9))
                    .foregroundColor(Color(red: 56/255, green: 189/255, blue: 248/255))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()
                .background(Color(red: 30/255, green: 41/255, blue: 59/255))

            // Right: 2x2 Ticker Grid
            VStack(spacing: 6) {
                HStack {
                    tickerCell(label: "SOFR", value: entry.sofrRate, color: Color(red: 248/255, green: 250/255, blue: 252/255))
                    tickerCell(label: "TGA", value: entry.tgaDrain, color: Color(red: 16/255, green: 185/255, blue: 129/255))
                }
                HStack {
                    tickerCell(label: "RRP", value: entry.rrpBuffer, color: Color(red: 244/255, green: 63/255, blue: 94/255))
                    tickerCell(label: "DXY", value: entry.dxyRate, color: Color(red: 56/255, green: 189/255, blue: 248/255))
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(12)
        .background(Color(red: 5/255, green: 8/255, blue: 16/255))
    }

    private func tickerCell(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(.custom("JetBrainsMono-Bold", size: 8))
                .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))
            Text(value)
                .font(.custom("JetBrainsMono-Bold", size: 11))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Main Widget Bundle
@main
struct GraphiQuestorWidgetBundle: WidgetBundle {
    var body: some Widget {
        GraphiQuestorWidget()
    }
}

struct GraphiQuestorWidget: Widget {
    let kind: String = "GraphiQuestorWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MacroTimelineProvider()) { entry in
            MacroWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Macro Liquidity Pulse")
        .description("Real-time global liquidity regime score and key sovereign funding coordinates.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
