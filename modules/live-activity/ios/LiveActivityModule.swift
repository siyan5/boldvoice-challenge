import ActivityKit
import ExpoModulesCore

// Mirrors LiveActivityAttributes in ../index.ts.
struct AttributesRecord: Record {
  @Field var name: String = ""

  func toAttributes() -> StudyTimerAttributes {
    StudyTimerAttributes(name: name)
  }
}

// Mirrors LiveActivityContentState in ../index.ts. Timestamps (rather than a
// running tick count) cross the bridge so the widget can compute elapsed time
// on its own clock without needing frequent updates from JS.
struct ContentStateRecord: Record {
  @Field var isPaused: Bool = false
  @Field var timerStartMs: Double = 0
  @Field var elapsedMs: Double = 0
  @Field var goalMs: Double = 0

  func toContentState() -> StudyTimerAttributes.ContentState {
    StudyTimerAttributes.ContentState(
      isPaused: isPaused, timerStartMs: timerStartMs, elapsedMs: elapsedMs, goalMs: goalMs)
  }

  // While running, mark the activity stale at the moment the goal is reached so the
  // widget re-renders once (context.isStale) and can say "Goal reached" without an update.
  func toContent() -> ActivityContent<StudyTimerAttributes.ContentState> {
    let state = toContentState()
    return ActivityContent(state: state, staleDate: state.isPaused ? nil : state.goalEnd)
  }
}

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    Function("areActivitiesEnabled") {
      ActivityAuthorizationInfo().areActivitiesEnabled
    }

    AsyncFunction("startActivity") { (attributes: AttributesRecord, state: ContentStateRecord) async throws in
      let newAttributes = attributes.toAttributes()
      let newContent = state.toContent()
      // App relaunch re-adopts a persisted session: if the surviving activity already
      // shows exactly this session, leave it alone instead of blinking it off and on.
      if let existing = Activity<StudyTimerAttributes>.activities.first,
         Activity<StudyTimerAttributes>.activities.count == 1,
         existing.attributes == newAttributes,
         existing.content.state == newContent.state {
        return
      }
      // Only one Live Activity exists at a time by design: end any existing
      // activity first so we never leave a zombie activity running.
      for activity in Activity<StudyTimerAttributes>.activities {
        await activity.end(dismissalPolicy: .immediate)
      }
      _ = try Activity<StudyTimerAttributes>.request(
        attributes: newAttributes,
        content: newContent,
        pushType: nil
      )
    }

    // Diagnostic for edge-case tests: how many of our activities the system still holds.
    Function("getActivityCount") {
      Activity<StudyTimerAttributes>.activities.count
    }

    AsyncFunction("updateActivity") { (state: ContentStateRecord) async in
      let content = state.toContent()
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
