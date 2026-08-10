import { ClassProvider } from './data/classes/ClassContext';
import { LessonsProvider } from './data/lessons/LessonsContext';
import { StudentProvider } from './data/students/StudentContext';
import { DemoDataProvider } from './data/settings/DemoDataContext';
import { AppThemePreferencesProvider } from './data/settings/AppThemePreferencesContext';
import { AccessibilityPreferencesProvider } from './data/settings/AccessibilityPreferencesContext';
import { AlarmSoundPreferencesProvider } from './data/settings/AlarmSoundPreferencesContext';
import { BankAccessProvider } from './data/bank/BankAccessContext';
import { RandomizerPoolProvider } from './data/randomizer/RandomizerPoolContext';
import { GroupsProvider } from './data/groups/GroupsContext';
import { LiveAnnouncerProvider } from './shared/LiveAnnouncer';
import { AppShell } from './shell/AppShell';

export default function App() {
  return (
    <DemoDataProvider>
      <AppThemePreferencesProvider>
        <AccessibilityPreferencesProvider>
          <AlarmSoundPreferencesProvider>
            <LiveAnnouncerProvider>
              <StudentProvider>
                <ClassProvider>
                  <LessonsProvider>
                    <BankAccessProvider>
                      <RandomizerPoolProvider>
                        <GroupsProvider>
                          <AppShell />
                        </GroupsProvider>
                      </RandomizerPoolProvider>
                    </BankAccessProvider>
                  </LessonsProvider>
                </ClassProvider>
              </StudentProvider>
            </LiveAnnouncerProvider>
          </AlarmSoundPreferencesProvider>
        </AccessibilityPreferencesProvider>
      </AppThemePreferencesProvider>
    </DemoDataProvider>
  );
}
