import ActivityKit
import ExpoModulesCore

// Mirrors LiveActivityAttributes in ../index.ts.
struct AttributesRecord: Record {
  @Field var name: String = ""
  @Field var goalMs: Double = 0

  func toAttributes() -> StudyTimerAttributes {
    StudyTimerAttributes(name: name, goalMs: goalMs)
  }
}

// Mirrors LiveActivityContentState in ../index.ts. Timestamps (rather than a
// running tick count) cross the bridge so the widget can compute elapsed time
// on its own clock without needing frequent updates from JS.
struct ContentStateRecord: Record {
  @Field var isPaused: Bool = false
  @Field var timerStartMs: Double = 0
  @Field var elapsedMs: Double = 0

  func toContentState() -> StudyTimerAttributes.ContentState {
    StudyTimerAttributes.ContentState(isPaused: isPaused, timerStartMs: timerStartMs, elapsedMs: elapsedMs)
  }
}

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    Function("areActivitiesEnabled") {
      ActivityAuthorizationInfo().areActivitiesEnabled
    }

    AsyncFunction("startActivity") { (attributes: AttributesRecord, state: ContentStateRecord) async throws in
      // Only one Live Activity exists at a time by design: end any existing
      // activity first so we never leave a zombie activity running.
      for activity in Activity<StudyTimerAttributes>.activities {
        await activity.end(dismissalPolicy: .immediate)
      }
      let content = ActivityContent(state: state.toContentState(), staleDate: nil)
      _ = try Activity<StudyTimerAttributes>.request(
        attributes: attributes.toAttributes(),
        content: content,
        pushType: nil
      )
    }

    AsyncFunction("updateActivity") { (state: ContentStateRecord) async in
      let content = ActivityContent(state: state.toContentState(), staleDate: nil)
      for activity in Activity<StudyTimerAttributes>.activities {
        await activity.update(content)
      }
    }

    AsyncFunction("endActivity") { () async in
      for activity in Activity<StudyTimerAttributes>.activities {
        await activity.end(dismissalPolicy: .immediate)
      }
    }
  }
}
