import WidgetKit

struct TodayGlanceEntry: TimelineEntry {
    let date: Date
    let stats: TodayGlanceStats
}

struct TodayGlanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayGlanceEntry {
        TodayGlanceEntry(date: Date(), stats: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayGlanceEntry) -> Void) {
        let stats = context.isPreview ? .placeholder : TodayGlanceStats.loadFromSharedStorage()
        completion(TodayGlanceEntry(date: Date(), stats: stats))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayGlanceEntry>) -> Void) {
        let entry = TodayGlanceEntry(date: Date(), stats: TodayGlanceStats.loadFromSharedStorage())
        // The RN app proactively calls WidgetCenter.reloadTimelines() whenever stats change;
        // this periodic refresh is just a fallback in case that push is missed.
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}
