import { hubApp } from './hub/config';
import { classesApp } from './classes/config';
import { studentsApp } from './students/config';
import { randomizerApp } from './randomizer/config';
import { dashboardApp } from './dashboard/config';
import { groupsApp } from './groups/config';
import { tiebreakerApp } from './tiebreaker/config';
import { noiseMeterApp } from './noisemeter/config';
import { timerApp } from './timer/config';
import { designApp } from './design/config';
import { earlyLiteracyApp } from './earlyliteracy/config';
import { gamesApp } from './games/config';

export { launcherApps } from './launcher';

/** Fully wired apps (have nav config + can drive the shell). */
export const apps = {
  [hubApp.id]: hubApp,
  [classesApp.id]: classesApp,
  [studentsApp.id]: studentsApp,
  [randomizerApp.id]: randomizerApp,
  [dashboardApp.id]: dashboardApp,
  [groupsApp.id]: groupsApp,
  [tiebreakerApp.id]: tiebreakerApp,
  [noiseMeterApp.id]: noiseMeterApp,
  [timerApp.id]: timerApp,
  [designApp.id]: designApp,
  [earlyLiteracyApp.id]: earlyLiteracyApp,
  [gamesApp.id]: gamesApp,
};

/** Hub is the default entry app. */
export const defaultAppId = hubApp.id;

export function getApp(appId) {
  return apps[appId] || apps[defaultAppId];
}
