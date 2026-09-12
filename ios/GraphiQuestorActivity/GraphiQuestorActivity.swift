import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes
public struct MacroRegimeActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var score: Int
        public var regimeStatus: String
        public var netLiquidityDeltaUSD: Double
        public var rateCutProbabilityPercent: Int
        public var nextEventName: String
        public var timeUntilEventString: String

        public init(
            score: Int,
            regimeStatus: String,
            netLiquidityDeltaUSD: Double,
            rateCutProbabilityPercent: Int,
            nextEventName: String,
            timeUntilEventString: String
        ) {
            self.score = score
            self.regimeStatus = regimeStatus
            self.netLiquidityDeltaUSD = netLiquidityDeltaUSD
            self.rateCutProbabilityPercent = rateCutProbabilityPercent
            self.nextEventName = nextEventName
            self.timeUntilEventString = timeUntilEventString
        }
    }

    public var eventTitle: String

    public init(eventTitle: String = "FOMC Rate Decision & Liquidity Pulse") {
        self.eventTitle = eventTitle
    }
}

// MARK: - Activity Widget Definition
public struct GraphiQuestorActivityWidget: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: MacroRegimeActivityAttributes.self) { context in
            // Lock Screen Live Activity Banner
            lockScreenBanner(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Leading
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("REGIME")
                            .font(.custom("JetBrainsMono-Bold", size: 8))
                            .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))
                        Text("\(context.state.score)/100")
                            .font(.custom("SpaceGrotesk-SemiBold", size: 16))
                            .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                    }
                }

                // Expanded Trailing
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("CUT ODDS")
                            .font(.custom("JetBrainsMono-Bold", size: 8))
                            .foregroundColor(Color(red: 148/255, green: 163/255, blue: 184/255))
                        Text("\(context.state.rateCutProbabilityPercent)%")
                            .font(.custom("SpaceGrotesk-SemiBold", size: 16))
                            .foregroundColor(Color(red: 56/255, green: 189/255, blue: 248/255))
                    }
                }

                // Expanded Bottom
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.nextEventName)
                            .font(.custom("Inter-Regular", size: 11))
                            .foregroundColor(Color(red: 248/255, green: 250/255, blue: 252/255))

                        Spacer()

                        Text(context.state.timeUntilEventString)
                            .font(.custom("JetBrainsMono-Bold", size: 11))
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    }
                    .padding(.top, 4)
                }
            } compactLeading: {
                // Compact Leading: Cyan Flash Beacon
                HStack(spacing: 3) {
                    Circle()
                        .fill(Color(red: 56/255, green: 189/255, blue: 248/255))
                        .frame(width: 6, height: 6)
                    Text("GQ")
                        .font(.custom("SpaceGrotesk-SemiBold", size: 10))
                        .foregroundColor(Color(red: 248/255, green: 250/255, blue: 252/255))
                }
            } compactTrailing: {
                // Compact Trailing: Net Liq delta
                let delta = context.state.netLiquidityDeltaUSD
                let prefix = delta >= 0 ? "+" : ""
                Text("\(prefix)$\(Int(delta))B")
                    .font(.custom("JetBrainsMono-Bold", size: 10))
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
            } minimal: {
                Circle()
                    .fill(Color(red: 56/255, green: 189/255, blue: 248/255))
                    .frame(width: 8, height: 8)
            }
        }
    }

    private func lockScreenBanner(context: ActivityViewContext<MacroRegimeActivityAttributes>) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(context.attributes.eventTitle)
                    .font(.custom("SpaceGrotesk-SemiBold", size: 12))
                    .foregroundColor(Color(red: 248/255, green: 250/255, blue: 252/255))

                Text("Systemic Status: \(context.state.regimeStatus) (\(context.state.score)/100)")
                    .font(.custom("Inter-Regular", size: 10))
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                let delta = context.state.netLiquidityDeltaUSD
                let prefix = delta >= 0 ? "+" : ""
                Text("\(prefix)$\(String(format: "%.1f", delta))B Net")
                    .font(.custom("JetBrainsMono-Bold", size: 12))
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))

                Text(context.state.timeUntilEventString)
                    .font(.custom("JetBrainsMono-Bold", size: 9))
                    .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
            }
        }
        .padding(14)
        .background(Color(red: 5/255, green: 8/255, blue: 16/255))
    }
}
