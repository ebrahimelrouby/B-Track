import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var manager = WorkoutSessionManager.shared

    var body: some View {
        Group {
            if manager.state.isActive {
                ActiveWorkoutView(state: manager.state, manager: manager)
            } else {
                IdleView(onStart: { manager.sendAction("startWorkout") })
            }
        }
    }
}

// MARK: — Idle View

struct IdleView: View {
    let onStart: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "dumbbell")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(Color(hex: "#AAFF00"))

            Text("B-TRACK")
                .font(.system(size: 13, weight: .black))
                .foregroundColor(.white)
                .tracking(3)

            Text("Start a workout\non your phone, or right here")
                .font(.system(size: 11))
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)

            Button(action: onStart) {
                Text("Start Workout")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color(hex: "#AAFF00"))
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
    }
}

// MARK: — Active Workout View

struct ActiveWorkoutView: View {
    let state: WorkoutState
    let manager: WorkoutSessionManager

    @State private var now = Date()
    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var elapsedSeconds: Int {
        guard let startedAtMs = state.startedAtMs else { return 0 }
        return max(0, Int((now.timeIntervalSince1970 * 1000 - startedAtMs) / 1000))
    }

    private var restRemainingSeconds: Int? {
        guard let restEndTimeMs = state.restEndTimeMs else { return nil }
        let remaining = Int((restEndTimeMs - now.timeIntervalSince1970 * 1000) / 1000)
        return remaining > 0 ? remaining : nil
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text(formatTime(elapsedSeconds))
                    .font(.system(.title3, design: .monospaced, weight: .bold))
                    .foregroundColor(.white)

                if let name = state.workoutName {
                    Text(name)
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                }

                Divider().background(Color.gray.opacity(0.3))

                if let rest = restRemainingSeconds {
                    Text("REST")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(hex: "#AAFF00"))
                    Text(formatTime(rest))
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(hex: "#AAFF00"))
                    Button(action: { manager.sendAction("skipRest") }) {
                        Text("Skip Rest")
                            .font(.system(size: 12, weight: .semibold))
                    }
                } else {
                    if let exercise = state.currentExerciseName {
                        Text(exercise)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    if state.lastWeightKg != nil || state.lastReps != nil {
                        Text("\(fmtWeight(state.lastWeightKg)) kg × \(state.lastReps.map(String.init) ?? "-") reps")
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                    Button(action: { manager.sendAction("logSet") }) {
                        Text("Log Set ✓")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color(hex: "#AAFF00"))
                            .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                }

                Button(action: { manager.sendAction("finishWorkout") }) {
                    Text("Finish Workout")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.red)
                }
            }
            .padding()
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.05))
        .onReceive(ticker) { now = $0 }
        // Re-runs whenever the phone pushes a new rest end time (new rest period
        // started, or cleared via skip) and fires exactly once when it naturally elapses.
        .task(id: state.restEndTimeMs) {
            guard let endTime = state.restEndTimeMs else { return }
            let remainingMs = endTime - Date().timeIntervalSince1970 * 1000
            guard remainingMs > 0 else { return }
            try? await Task.sleep(nanoseconds: UInt64(remainingMs * 1_000_000))
            guard !Task.isCancelled else { return }
            WKInterfaceDevice.current().play(.notification)
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }

    private func fmtWeight(_ w: Double?) -> String {
        guard let w else { return "-" }
        return w == w.rounded() ? String(Int(w)) : String(w)
    }
}

// MARK: — Color extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int & 0xFF0000) >> 16) / 255
        let g = Double((int & 0xFF00) >> 8) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
