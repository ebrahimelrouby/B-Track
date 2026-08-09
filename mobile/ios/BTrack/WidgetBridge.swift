import Foundation
import WidgetKit

/// Bridges the RN dashboard's "today" stats into the shared App Group storage
/// that the BTrackWidget extension reads from, then nudges WidgetKit to redraw.
@objc(WidgetBridge)
class WidgetBridge: NSObject {

    @objc
    static func requiresMainQueueSetup() -> Bool { false }

    @objc(updateStats:)
    func updateStats(_ stats: NSDictionary) {
        guard
            let defaults = UserDefaults(suiteName: widgetAppGroupId),
            let data = try? JSONSerialization.data(withJSONObject: stats, options: []),
            let json = String(data: data, encoding: .utf8)
        else { return }

        defaults.set(json, forKey: widgetStatsDefaultsKey)
        WidgetCenter.shared.reloadTimelines(ofKind: "TodayGlanceWidget")
    }
}
