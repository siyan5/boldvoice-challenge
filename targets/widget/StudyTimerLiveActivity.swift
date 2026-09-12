import ActivityKit
import SwiftUI
import WidgetKit

/// Formats a duration as zero-padded HH:MM:SS. Hours are not capped at 99.
func formatHMS(_ seconds: TimeInterval) -> String {
  let total = Int(seconds.rounded(.down))
  let hours = total / 3600
  let minutes = (total % 3600) / 60
  let secs = total % 60
  return String(format: "%02d:%02d:%02d", hours, minutes, secs)
}

/// Shows a live counting timer when running, or a frozen HH:MM:SS when paused.
struct TimerText: View {
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    if state.isPaused {
      Text(formatHMS(state.elapsed()))
        .monospacedDigit()
    } else {
      Text(
        timerInterval: state.timerStart...(state.timerStart.addingTimeInterval(100 * 3600)),
        countsDown: false
      )
      .monospacedDigit()
    }
  }
}

/// Shared progress bar + "Paused" caption used by the lock screen and the
/// Dynamic Island's expanded bottom region.
struct StudyTimerProgress: View {
  let attributes: StudyTimerAttributes
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      if state.isPaused {
        ProgressView(value: min(1, state.elapsed() / attributes.goal))
      } else {
        // System-driven so the bar advances without updates from the app.
        ProgressView(
          timerInterval: state.timerStart...state.timerStart.addingTimeInterval(attributes.goal),
          countsDown: false,
          label: { EmptyView() },
          currentValueLabel: { EmptyView() }
        )
      }
      if state.isPaused {
        Text("Paused")
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    }
  }
}

struct StudyTimerLockScreenView: View {
  let attributes: StudyTimerAttributes
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("📚")
        Text(attributes.name)
          .lineLimit(1)
        Spacer()
        TimerText(state: state)
      }
      StudyTimerProgress(attributes: attributes, state: state)
    }
    .padding()
  }
}

struct StudyTimerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StudyTimerAttributes.self) { context in
      StudyTimerLockScreenView(attributes: context.attributes, state: context.state)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text("📚 \(context.attributes.name)")
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerText(state: context.state)
        }
        DynamicIslandExpandedRegion(.bottom) {
          StudyTimerProgress(attributes: context.attributes, state: context.state)
        }
      } compactLeading: {
        Text(context.attributes.name)
          .lineLimit(1)
          .frame(maxWidth: 60)
      } compactTrailing: {
        TimerText(state: context.state)
          .frame(maxWidth: 64)
      } minimal: {
        TimerText(state: context.state)
          .font(.caption2)
      }
    }
  }
}
