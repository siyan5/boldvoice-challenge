import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/theme/fonts';
import { useTimer } from './src/timer/useTimer';
import { FirstRunScreen } from './src/screens/FirstRunScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SessionCompleteScreen } from './src/screens/SessionCompleteScreen';
import { NewSessionSheet } from './src/screens/NewSessionSheet';

// The timer state machine is the router: idle → first run, running/paused → timer,
// completed → summary. The new-session sheet overlays any of them.
export default function App() {
  const fontsReady = useAppFonts();
  const timer = useTimer();
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = () => setSheetOpen(true);

  if (!fontsReady) return null;

  const { state } = timer;
  let screen;
  if (state.status === 'idle') {
    screen = <FirstRunScreen onStart={openSheet} />;
  } else if (state.status === 'completed') {
    screen = <SessionCompleteScreen state={state} onStartAnother={openSheet} onDone={timer.dismiss} />;
  } else {
    screen = (
      <TimerScreen
        state={state}
        elapsedMs={timer.elapsedMs}
        remainingMs={timer.remainingMs}
        liveActivityEnabled={timer.liveActivityEnabled}
        liveActivitySupported={timer.liveActivitySupported}
        onPause={timer.pause}
        onResume={timer.resume}
        onStop={timer.stop}
        onNewSession={openSheet}
        onToggleLiveActivity={timer.setLiveActivityEnabled}
      />
    );
  }

  return (
    <>
      {screen}
      <NewSessionSheet
        visible={sheetOpen}
        recentNames={timer.recentNames}
        onStart={(name, goalMs) => {
          setSheetOpen(false);
          timer.start(name, goalMs);
        }}
        onClose={() => setSheetOpen(false)}
      />
      <StatusBar style="dark" />
    </>
  );
}
