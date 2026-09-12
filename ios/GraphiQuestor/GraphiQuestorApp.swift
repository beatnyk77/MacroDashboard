import SwiftUI
import SwiftData

@main
struct GraphiQuestorApp: App {
    let container: ModelContainer

    init() {
        do {
            let schema = Schema([
                MacroRegimeEntity.self,
                TickerRateEntity.self,
                EdgarDistressEntity.self,
                AudioDigestMetadata.self
            ])

            // Configure App Group shared container for WidgetKit and Dynamic Island
            let appGroupIdentifier = "group.com.graphiquestor.terminal"
            let storeURL: URL

            if let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) {
                storeURL = groupURL.appendingPathComponent("GraphiQuestorTerminal.sqlite")
            } else {
                let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                storeURL = docs.appendingPathComponent("GraphiQuestorTerminal.sqlite")
            }

            let configuration = ModelConfiguration(
                "GraphiQuestorSchema",
                schema: schema,
                url: storeURL,
                allowsSave: true
            )

            container = try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to initialize SwiftData ModelContainer: \(error.localizedDescription)")
        }
    }

    var body: some Scene {
        WindowGroup {
            MainTerminalView()
                .preferredColorScheme(.dark)
        }
        .modelContainer(container)
    }
}
