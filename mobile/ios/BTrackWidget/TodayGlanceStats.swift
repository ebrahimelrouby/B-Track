import Foundation

let widgetAppGroupId = "group.org.reactjs.native.example.BTrack"
let widgetStatsDefaultsKey = "todayGlanceStats"

struct TodayGlanceStats: Codable {
    var signedIn: Bool
    var caloriesConsumed: Double
    var caloriesTarget: Double
    var waterMl: Double
    var waterTargetMl: Double
    var stepsToday: Double
    var stepsTarget: Double
    var sleepHours: Double
    var sleepTargetHours: Double
    var primaryColorHex: String

    static let placeholder = TodayGlanceStats(
        signedIn: true,
        caloriesConsumed: 1450, caloriesTarget: 2200,
        waterMl: 1200, waterTargetMl: 2500,
        stepsToday: 6200, stepsTarget: 10000,
        sleepHours: 7.5, sleepTargetHours: 8,
        primaryColorHex: "#AAFF00"
    )

    static let signedOut = TodayGlanceStats(
        signedIn: false,
        caloriesConsumed: 0, caloriesTarget: 2200,
        waterMl: 0, waterTargetMl: 2500,
        stepsToday: 0, stepsTarget: 10000,
        sleepHours: 0, sleepTargetHours: 8,
        primaryColorHex: "#AAFF00"
    )

    static func loadFromSharedStorage() -> TodayGlanceStats {
        guard
            let defaults = UserDefaults(suiteName: widgetAppGroupId),
            let json = defaults.string(forKey: widgetStatsDefaultsKey),
            let data = json.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(TodayGlanceStats.self, from: data)
        else {
            return .signedOut
        }
        return decoded
    }
}
