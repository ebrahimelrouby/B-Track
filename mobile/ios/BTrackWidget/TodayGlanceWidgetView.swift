import SwiftUI
import WidgetKit

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.hasPrefix("#") ? String(s.dropFirst()) : s
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8) & 0xFF) / 255
        let b = Double(value & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

private let bgColor = Color(hex: "#141414")
private let trackColor = Color(hex: "#1C1C1C")
private let textPrimary = Color.white
private let textSecondary = Color(hex: "#A1A1A1")
private let textTertiary = Color(hex: "#6B6B6B")
private let waterColor = Color(hex: "#60A5FA")
private let sleepColor = Color(hex: "#8B7CF6")
private let successColor = Color(hex: "#22C55E")

private extension View {
    /// `.containerBackground` is required on iOS 17+ (widgets error without it);
    /// older OS versions still support a plain `.background`.
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

private struct ProgressBar: View {
    let progress: Double
    let color: Color

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(trackColor)
                RoundedRectangle(cornerRadius: 3)
                    .fill(color)
                    .frame(width: geo.size.width * max(0, min(1, progress)))
            }
        }
        .frame(height: 6)
    }
}

private struct StatRow: View {
    let label: String
    let value: Double
    let target: Double
    let unit: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(.system(size: 11)).foregroundColor(textSecondary)
                Spacer()
                Text("\(Int(value)) / \(Int(target)) \(unit)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(color)
            }
            ProgressBar(progress: target > 0 ? value / target : 0, color: color)
        }
    }
}

struct TodayGlanceWidgetView: View {
    @Environment(\.widgetFamily) var family
    let stats: TodayGlanceStats

    private var accent: Color { Color(hex: stats.primaryColorHex) }

    var body: some View {
        if !stats.signedIn {
            VStack {
                Text("Open B-Track to sign in")
                    .font(.system(size: 13))
                    .foregroundColor(textSecondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .widgetBackground(bgColor)
        } else {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    HStack(spacing: 6) {
                        Circle().fill(accent).frame(width: 8, height: 8)
                        Text("B-Track").font(.system(size: 12, weight: .bold)).foregroundColor(textPrimary)
                    }
                    Spacer()
                    Text(Date(), style: .date)
                        .font(.system(size: 10))
                        .foregroundColor(textTertiary)
                }

                StatRow(label: "Calories", value: stats.caloriesConsumed, target: stats.caloriesTarget, unit: "kcal", color: accent)
                StatRow(label: "Water", value: stats.waterMl, target: stats.waterTargetMl, unit: "ml", color: waterColor)

                if family == .systemMedium {
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text("\(Int(stats.stepsToday)) steps").font(.system(size: 10, weight: .bold)).foregroundColor(successColor)
                            Text("of \(Int(stats.stepsTarget)) goal").font(.system(size: 9)).foregroundColor(textTertiary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 1) {
                            Text("\(stats.sleepHours, specifier: "%.1f")h sleep").font(.system(size: 10, weight: .bold)).foregroundColor(sleepColor)
                            Text("of \(Int(stats.sleepTargetHours))h goal").font(.system(size: 9)).foregroundColor(textTertiary)
                        }
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetBackground(bgColor)
        }
    }
}
