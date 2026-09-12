import SwiftUI

public struct FloatingCommandHUDView: View {
    public let activeDistressCount: Int
    public let isAudioPlaying: Bool
    public let onSearchTapped: () -> Void
    public let onAudioTapped: () -> Void
    public let onZombiesTapped: () -> Void
    public let onDesksTapped: () -> Void

    public init(
        activeDistressCount: Int = 14,
        isAudioPlaying: Bool = false,
        onSearchTapped: @escaping () -> Void = {},
        onAudioTapped: @escaping () -> Void = {},
        onZombiesTapped: @escaping () -> Void = {},
        onDesksTapped: @escaping () -> Void = {}
    ) {
        self.activeDistressCount = activeDistressCount
        self.isAudioPlaying = isAudioPlaying
        self.onSearchTapped = onSearchTapped
        self.onAudioTapped = onAudioTapped
        self.onZombiesTapped = onZombiesTapped
        self.onDesksTapped = onDesksTapped
    }

    public var body: some View {
        HStack(spacing: 14) {
            // Search / Spotlight Button
            Button(action: onSearchTapped) {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cyanVector)

                    Text("Query / ⌘K")
                        .font(.spaceGrotesk(size: 11, weight: .medium))
                        .foregroundColor(.mutedSlate)
                }
            }

            Spacer()

            // Audio Briefing Trigger
            Button(action: onAudioTapped) {
                HStack(spacing: 4) {
                    Image(systemName: isAudioPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.cyanVector)

                    Text("DIGEST")
                        .font(.jetBrainsMono(size: 9, weight: .bold))
                        .foregroundColor(.dataWhite)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.subSurface)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.hairlineBorder, lineWidth: 0.8))
            }

            // Zombie Distress Filter
            Button(action: onZombiesTapped) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.roseStress)
                        .padding(4)

                    if activeDistressCount > 0 {
                        Text("\(activeDistressCount)")
                            .font(.jetBrainsMono(size: 7, weight: .bold))
                            .foregroundColor(.dataWhite)
                            .padding(.horizontal, 3)
                            .padding(.vertical, 1)
                            .background(Color.roseStress)
                            .clipShape(Capsule())
                            .offset(x: 6, y: -4)
                    }
                }
            }

            // Desks Switcher Pill
            Button(action: onDesksTapped) {
                HStack(spacing: 3) {
                    Text("DESKS")
                        .font(.spaceGrotesk(size: 10, weight: .bold))
                        .foregroundColor(.obsidianVoid)

                    Image(systemName: "chevron.up")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.obsidianVoid)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Color.cyanVector)
                .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 9)
        .background(Color.glassSurface.opacity(0.92))
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.cyanVector.opacity(0.35), lineWidth: 1.0))
        .shadow(color: Color.black.opacity(0.6), radius: 16, x: 0, y: 6)
        .padding(.horizontal, 16)
    }
}
