import ActivityKit
import Foundation

// Shared contract between the app (via the LiveActivity Expo module) and the
// widget extension. This file exists in two places and must stay byte-identical:
//   modules/live-activity/ios/StudyTimerAttributes.swift
//   targets/widget/StudyTimerAttributes.swift
// A Jest test (sharedAttributes.test.ts) fails if they drift. ActivityKit matches
// the app's Activity.request with the widget's ActivityConfiguration by type name,
// so both copies must declare the same `StudyTimerAttributes`.
// Mirrors src/timer/liveActivityState.ts.
struct StudyTimerAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    /// True while the timer is paused.
    var isPaused: Bool
    /// Epoch milliseconds the count-up timer started from (runningSince - accumulated). 0 when paused.
    var timerStartMs: Double
    /// Frozen elapsed milliseconds while paused. 0 when running.
    var elapsedMs: Double
    /// Goal duration in milliseconds; fills the progress bar and ring.
    var goalMs: Double

    var timerStart: Date { Date(timeIntervalSince1970: timerStartMs / 1000) }
    var goal: TimeInterval { goalMs / 1000 }
    /// The moment the goal is reached if the timer keeps running. Only meaningful while running.
    var goalEnd: Date { timerStart.addingTimeInterval(goal) }

    /// Elapsed time as of `now`, valid in both states.
    func elapsed(at now: Date = Date()) -> TimeInterval {
      isPaused ? elapsedMs / 1000 : max(0, now.timeIntervalSince(timerStart))
    }

    /// 0...1 progress toward the goal as of `now`.
    func progress(at now: Date = Date()) -> Double {
      goal > 0 ? min(1, elapsed(at: now) / goal) : 0
    }
  }

  /// Session name, fixed for the activity's lifetime.
  var name: String
}
