import SwiftUI

public struct MacroTickerRibbonView: View {
    public let tickers: [TickerRateEntity]

    public init(tickers: [TickerRateEntity]) {
        self.tickers = tickers
    }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(tickers) { ticker in
                    HStack(spacing: 5) {
                        Text(ticker.name)
                            .font(.jetBrainsMono(size: 10, weight: .semibold))
                            .foregroundColor(.mutedSlate)

                        Text(ticker.displayValue)
                            .font(.jetBrainsMono(size: 11, weight: .bold))
                            .monospacedDigit()
                            .foregroundColor(.dataWhite)

                        Text(ticker.deltaValue)
                            .font(.jetBrainsMono(size: 9, weight: .medium))
                            .monospacedDigit()
                            .foregroundColor(deltaColor(for: ticker.deltaType))
                            .padding(.horizontal, 3)
                            .padding(.vertical, 1)
                            .background(deltaColor(for: ticker.deltaType).opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 2))
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 6)
                    .glassCard(cornerRadius: 3, borderColor: .hairlineBorder.opacity(0.7), backgroundColor: .obsidianVoid)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
        }
        .background(Color.obsidianVoid)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(.hairlineBorder),
            alignment: .bottom
        )
    }

    private func deltaColor(for deltaType: String) -> Color {
        switch deltaType.uppercased() {
        case "POSITIVE": return .emeraldNormalcy
        case "NEGATIVE": return .roseStress
        case "WARNING": return .amberWarning
        default: return .cyanVector
        }
    }
}
