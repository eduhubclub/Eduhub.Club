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
import { brandApp } from './brand/config';
import { earlyLiteracyApp } from './earlyliteracy/config';
import { gamesApp } from './games/config';
import { arcadeApp } from './arcade/config';
import { bankApp } from './bank/config';
import { behaviorApp } from './behavior/config';
import { jobsApp } from './jobs/config';
import { mathToolsApp } from './mathTools/config';
import { attendanceApp } from './attendance/config';
import { storeApp } from './store/config';
import { calendarApp } from './calendar/config';
import { paperApp } from './paper/config';
import { dictionaryApp } from './dictionary/config';

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
  [brandApp.id]: brandApp,
  [earlyLiteracyApp.id]: earlyLiteracyApp,
  [gamesApp.id]: gamesApp,
  [arcadeApp.id]: arcadeApp,
  [bankApp.id]: bankApp,
  [behaviorApp.id]: behaviorApp,
  [jobsApp.id]: jobsApp,
  [mathToolsApp.id]: mathToolsApp,
  [attendanceApp.id]: attendanceApp,
  [storeApp.id]: storeApp,
  [calendarApp.id]: calendarApp,
  [paperApp.id]: paperApp,
  [dictionaryApp.id]: dictionaryApp,
};

/** Hub is the default entry app. */
export const defaultAppId = hubApp.id;

export function getApp(appId) {
  return apps[appId] || apps[defaultAppId];
}
