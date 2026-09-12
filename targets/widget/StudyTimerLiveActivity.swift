import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Design tokens

private let accentStart = Color(red: 243 / 255, green: 107 / 255, blue: 60 / 255)
private let accentEnd = Color(red: 236 / 255, green: 47 / 255, blue: 124 / 255)
private let accentTint = Color(red: 244 / 255, green: 131 / 255, blue: 90 / 255)
private let pausedDark = Color(red: 252 / 255, green: 211 / 255, blue: 77 / 255)
private let lockCardBg = Color(red: 28 / 255, green: 31 / 255, blue: 44 / 255).opacity(0.82)

private let accentGradient = LinearGradient(
  colors: [accentStart, accentEnd],
  startPoint: .leading,
  endPoint: .trailing
)

private let badgeGradient = LinearGradient(
  colors: [accentStart, accentEnd],
  startPoint: .topLeading,
  endPoint: .bottomTrailing
)

/// Formats a duration as zero-padded HH:MM:SS. Hours are not capped at 99.
func formatHMS(_ seconds: TimeInterval) -> String {
  let total = Int(seconds.rounded(.down))
  let hours = total / 3600
  let minutes = (total % 3600) / 60
  let secs = total % 60
  return String(format: "%02d:%02d:%02d", hours, minutes, secs)
}

/// Formats a goal duration like "2h", "50m", "2h 30m".
func formatGoal(_ goalMs: Double) -> String {
  let totalMinutes = Int((goalMs / 1000 / 60).rounded())
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  if hours == 0 {
    return "\(minutes)m"
  } else if minutes == 0 {
    return "\(hours)h"
  } else {
    return "\(hours)h \(minutes)m"
  }
}

// MARK: - Shared, system-driven views (see D7: no per-second updates)

/// Shows a live counting timer when running, or a frozen HH:MM:SS when paused.
struct TimerText: View {
  let state: StudyTimerAttributes.ContentState
  let font: Font
  var alignment: TextAlignment = .trailing

  var body: some View {
    Group {
      if state.isPaused {
        Text(formatHMS(state.elapsed()))
      } else {
        Text(
          timerInterval: state.timerStart...(state.timerStart.addingTimeInterval(100 * 3600)),
          countsDown: false
        )
      }
    }
    .font(font)
    .monospacedDigit()
    // Timer text greedily claims horizontal space; pin it to the wanted edge.
    .multilineTextAlignment(alignment)
  }
}

/// "23:40 left" while the goal is ahead, "1:05 over goal" once it has passed, or "Paused".
/// Both timers are system-driven. The app sends one update at the goal instant so the
/// widget re-renders and switches branch; `isStale` (staleDate = goal end) is the fallback.
struct RemainingText: View {
  let state: StudyTimerAttributes.ContentState
  let isStale: Bool
  var alignment: TextAlignment = .trailing

  var body: some View {
    if state.isPaused {
      Text("Paused")
    } else if isStale || Date() >= state.goalEnd {
      (Text(timerInterval: state.goalEnd...state.goalEnd.addingTimeInterval(100 * 3600), countsDown: false)
        + Text(" over goal"))
        .monospacedDigit()
        .multilineTextAlignment(alignment)
    } else {
      (Text(timerInterval: state.timerStart...state.goalEnd, countsDown: true) + Text(" left"))
        .monospacedDigit()
        .multilineTextAlignment(alignment)
    }
  }
}

/// Linear goal progress bar, driven by the system clock while running.
struct GoalBar: View {
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    if state.isPaused {
      ProgressView(value: state.progress())
        .tint(Color.white.opacity(0.5))
    } else {
      ProgressView(
        timerInterval: state.timerStart...state.goalEnd,
        countsDown: false,
        label: { EmptyView() },
        currentValueLabel: { EmptyView() }
      )
      .tint(accentGradient)
    }
  }
}

/// Circular goal progress ring, driven by the system clock while running.
///
/// `lineWidth` is accepted to match the design token but the system
/// `.circular` progress view style does not expose stroke width as a public
/// modifier; ring thickness follows the platform default at the given frame
/// size.
struct GoalRing: View {
  let state: StudyTimerAttributes.ContentState
  let lineWidth: CGFloat

  var body: some View {
    if state.isPaused {
      ProgressView(value: state.progress())
        .progressViewStyle(.circular)
        .tint(pausedDark)
    } else {
      ProgressView(
        timerInterval: state.timerStart...state.goalEnd,
        countsDown: false,
        label: { EmptyView() },
        currentValueLabel: { EmptyView() }
      )
      .progressViewStyle(.circular)
      .tint(accentGradient)
    }
  }
}

// MARK: - Lock screen

struct StudyTimerLockScreenView: View {
  let attributes: StudyTimerAttributes
  let state: StudyTimerAttributes.ContentState
  let isStale: Bool

  var body: some View {
    VStack(spacing: 12) {
      HStack(spacing: 10) {
        RoundedRectangle(cornerRadius: 9)
          .fill(state.isPaused ? AnyShapeStyle(Color.white.opacity(0.14)) : AnyShapeStyle(badgeGradient))
          .frame(width: 30, height: 30)
          .overlay(
            Text("F")
              .font(.system(size: 14, weight: .bold))
              .foregroundStyle(.white)
          )

        Text(attributes.name)
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(.white.opacity(state.isPaused ? 0.8 : 1))
          .lineLimit(1)

        if state.isPaused {
          Text("PAUSED")
            .font(.system(size: 11, weight: .bold))
            .tracking(1.5)
            .foregroundStyle(pausedDark)
        }

        Spacer()

        TimerText(state: state, font: .system(size: 22, weight: .bold))
          .foregroundStyle(.white.opacity(state.isPaused ? 0.8 : 1))
      }

      GoalBar(state: state)
        .frame(height: 5)

      HStack {
        Text("\(Int(state.progress() * 100))% of \(formatGoal(state.goalMs)) goal")
        Spacer()
        RemainingText(state: state, isStale: isStale)
      }
      .font(.system(size: 12, weight: .medium))
      .foregroundStyle(.white.opacity(0.65))
    }
    .padding(.horizontal, 18)
    .padding(.vertical, 16)
  }
}

// MARK: - Widget

struct StudyTimerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StudyTimerAttributes.self) { context in
      StudyTimerLockScreenView(
        attributes: context.attributes,
        state: context.state,
        isStale: context.isStale
      )
      .activityBackgroundTint(lockCardBg)
      .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let state = context.state
      let isPaused = state.isPaused

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          GoalRing(state: state, lineWidth: 7)
            .frame(width: 56, height: 56)
        }
        DynamicIslandExpandedRegion(.center) {
          VStack(alignment: .leading, spacing: 2) {
            Text(isPaused ? "PAUSED" : "STUDYING")
              .font(.system(size: 11, weight: .semibold))
              .tracking(1)
              .foregroundStyle(isPaused ? pausedDark : accentTint)
            Text(context.attributes.name)
              .font(.system(size: 17, weight: .bold))
              .foregroundStyle(.white)
              .lineLimit(1)
            HStack(spacing: 0) {
              Text("\(formatGoal(state.goalMs)) goal · ")
              RemainingText(state: state, isStale: context.isStale, alignment: .leading)
            }
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(.white.opacity(0.6))
          }
        }
        DynamicIslandExpandedRegion(.bottom) {
          TimerText(state: state, font: .system(size: 40, weight: .heavy), alignment: .leading)
            .foregroundStyle(.white.opacity(isPaused ? 0.82 : 1))
            .frame(maxWidth: .infinity, alignment: .leading)
        }
      } compactLeading: {
        Text(context.attributes.name)
          .font(.system(size: 13, weight: .bold))
          .foregroundStyle(isPaused ? pausedDark : accentTint)
          .lineLimit(1)
          .frame(maxWidth: 72)
      } compactTrailing: {
        TimerText(state: state, font: .system(size: 13, weight: .bold))
          .foregroundStyle(.white.opacity(isPaused ? 0.7 : 1))
          .frame(maxWidth: 70)
      } minimal: {
        GoalRing(state: state, lineWidth: 3)
          .frame(width: 20, height: 20)
      }
    }
  }
}
