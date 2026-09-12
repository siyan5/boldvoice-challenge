import { StatusBar } from 'expo-status-bar';
import { TimerScreen } from './src/screens/TimerScreen';
import { useTimer } from './src/timer/useTimer';

export default function App() {
  const timer = useTimer();
  return (
    <>
      <TimerScreen {...timer} />
      <StatusBar style="auto" />
    </>
  );
}
