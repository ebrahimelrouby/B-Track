import WidgetKit
import SwiftUI

struct TodayGlanceWidget: Widget {
    let kind: String = "TodayGlanceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodayGlanceProvider()) { entry in
            TodayGlanceWidgetView(stats: entry.stats)
        }
        .configurationDisplayName("Today at a Glance")
        .description("Calories, water, steps and sleep for today.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct BTrackWidgetBundle: WidgetBundle {
    var body: some Widget {
        TodayGlanceWidget()
    }
}
