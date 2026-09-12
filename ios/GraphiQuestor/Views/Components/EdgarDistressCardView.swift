import SwiftUI

public struct EdgarDistressCardView: View {
    public let distressItem: EdgarDistressEntity

    public init(distressItem: EdgarDistressEntity) {
        self.distressItem = distressItem
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header: Ticker, Sector, and Alert Beacon
            HStack {
                Text(distressItem.ticker)
                    .font(.spaceGrotesk(size: 13, weight: .bold))
                    .foregroundColor(.dataWhite)

                Text("·")
                    .foregroundColor(.mutedSlate)

                Text(distressItem.companyName)
                    .font(.inter(size: 11, weight: .medium))
                    .foregroundColor(.mutedSlate)
                    .lineLimit(1)

                Spacer()

                // Distress Trigger Badge
                if distressItem.distressAlertTriggered {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.roseStress)
                            .frame(width: 5, height: 5)

                        Text("DISTRESS")
                            .font(.jetBrainsMono(size: 8, weight: .bold))
                            .foregroundColor(.roseStress)
                    }
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(Color.roseStress.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(Color.roseStress.opacity(0.3), lineWidth: 0.5)
                    )
                }
            }

            // Metrics Matrix
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 1) {
                    Text("ALTMAN Z")
                        .font(.jetBrainsMono(size: 8, weight: .semibold))
                        .foregroundColor(.mutedSlate)

                    Text(String(format: "%.2f", distressItem.altmanZScore))
                        .font(.jetBrainsMono(size: 12, weight: .bold))
                        .monospacedDigit()
                        .foregroundColor(distressItem.altmanZScore < 1.81 ? .roseStress : .dataWhite)
                }

                VStack(alignment: .leading, spacing: 1) {
                    Text("ICR RATIO")
                        .font(.jetBrainsMono(size: 8, weight: .semibold))
                        .foregroundColor(.mutedSlate)

                    Text(String(format: "%.2fx", distressItem.interestCoverageRatio))
                        .font(.jetBrainsMono(size: 12, weight: .bold))
                        .monospacedDigit()
                        .foregroundColor(distressItem.interestCoverageRatio < 1.0 ? .roseStress : .amberWarning)
                }

                VStack(alignment: .leading, spacing: 1) {
                    Text("MATURITY WALL")
                        .font(.jetBrainsMono(size: 8, weight: .semibold))
                        .foregroundColor(.mutedSlate)

                    Text("$\(Int(distressItem.debtMaturityWallUSD))M (\(distressItem.maturityQuarter))")
                        .font(.jetBrainsMono(size: 12, weight: .bold))
                        .monospacedDigit()
                        .foregroundColor(.dataWhite)
                }
            }

            // Summary / Risk Note
            Text(distressItem.filingSummary)
                .font(.inter(size: 11, weight: .regular))
                .foregroundColor(.mutedSlate)
                .lineLimit(2)

            // Bottom Ribbon: Filing Type + Spread
            HStack {
                Text(distressItem.latestFilingType)
                    .font(.jetBrainsMono(size: 9, weight: .medium))
                    .foregroundColor(.cyanVector)

                Spacer()

                Text("Spread: SOFR+\(distressItem.spreadToSOFRBps) bps")
                    .font(.jetBrainsMono(size: 9, weight: .regular))
                    .monospacedDigit()
                    .foregroundColor(.mutedSlate)
            }
        }
        .padding(10)
        .glassCard(cornerRadius: 4, borderColor: .hairlineBorder, backgroundColor: .subSurface)
    }
}
