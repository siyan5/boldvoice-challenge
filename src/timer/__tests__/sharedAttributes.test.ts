import { readFileSync } from 'fs';
import { join } from 'path';

// StudyTimerAttributes.swift is compiled into both the Expo module and the widget
// extension. CocoaPods cannot reach outside the module folder, so the file is
// duplicated; this test keeps the two copies identical.
const root = join(__dirname, '..', '..', '..');
const moduleCopy = join(root, 'modules', 'live-activity', 'ios', 'StudyTimerAttributes.swift');
const widgetCopy = join(root, 'targets', 'widget', 'StudyTimerAttributes.swift');

it('StudyTimerAttributes.swift is identical in the module and the widget target', () => {
  expect(readFileSync(moduleCopy, 'utf8')).toBe(readFileSync(widgetCopy, 'utf8'));
});
