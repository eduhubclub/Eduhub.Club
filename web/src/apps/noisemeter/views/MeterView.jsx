import { Pause, Play } from 'lucide-react';
import { MicPrompt } from '../MicPrompt';
import { SensitivitySlider, StageChrome } from '../StageChrome';
import { APP_NESTED_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/**
 * Classic dBA meter with pause and calibrated alert limit.
 */
export function MeterView({
  theme,
  isDarkMode,
  hasPermission,
  permissionError,
  dbLevel,
  sensitivity,
  setSensitivity,
  isPaused,
  setIsPaused,
  startMonitoring,
  isFullScreen,
  setIsFullScreen,
  activeProfile,
  alertThreshold,
  onOpenSettings,
}) {
  const isCalibrated = activeProfile?.targetLevel != null;
  const targetLevel = activeProfile?.targetLevel;

  return (
    <StageChrome
      isDarkMode={isDarkMode}
      theme={theme}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {!hasPermission ? (
          <div className="flex-1 flex flex-col p-6 sm:p-8 min-h-0">
            <MicPrompt
              isDarkMode={isDarkMode}
              theme={theme}
              onStart={startMonitoring}
              error={permissionError}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col h-full min-h-0 w-full">
            <div className="flex-1 flex flex-col justify-end min-h-0 px-6 sm:px-8 pt-10 sm:pt-14 pb-6">
              {!isCalibrated ? (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={`mb-4 w-full ${APP_NESTED_CARD} px-4 py-3 text-left transition-colors ${
                    isDarkMode
                      ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                      : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} text-amber-600`}>
                    Calibrate {activeProfile?.name ?? 'this activity'}
                  </p>
                  <p
                    className={`mt-1 ${TYPE.bodyMd} ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Set a target volume in Settings so alerts match your classroom.
                  </p>
                </button>
              ) : null}

              <div className="flex items-start gap-4 sm:gap-5">
                <div className="shrink-0 pt-8 min-w-[4.5rem]">
                  <div className="h-14 flex flex-col items-center justify-center">
                    <span
                      className={`${TYPE.displayLg} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {Math.round(alertThreshold)}
                    </span>
                    <span
                      className={`mt-0.5 ${TYPE.labelMicro} ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Goal
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 min-w-0 pt-8 pb-1">
                  {isCalibrated ? (
                    <div
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-20"
                      style={{ left: `${targetLevel}%` }}
                    >
                      <span
                        className={`${TYPE.labelMicro} mb-1 ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      >
                        Target
                      </span>
                      <div
                        className={`w-0.5 h-4 ${
                          isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  ) : null}
                  <div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-20"
                    style={{ left: `${alertThreshold}%` }}
                  >
                    <span className={`${TYPE.labelMicro} text-rose-500 mb-1`}>
                      Alert
                    </span>
                    <div className="w-0.5 h-4 bg-rose-500" />
                  </div>
                  <div
                    className={`relative w-full h-14 rounded-full overflow-hidden shadow-inner ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        background:
                          'linear-gradient(to right, #22c55e 0%, #eab308 40%, #f97316 65%, #ef4444 100%)',
                      }}
                    />
                    <div
                      className={`absolute top-0 right-0 bottom-0 transition-all duration-75 ease-linear ${
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                      }`}
                      style={{ width: `${100 - dbLevel}%` }}
                    />
                    {isCalibrated ? (
                      <div
                        className={`absolute top-0 bottom-0 w-0.5 z-10 -translate-x-1/2 ${
                          isDarkMode ? 'bg-emerald-300' : 'bg-emerald-600'
                        }`}
                        style={{ left: `${targetLevel}%` }}
                      />
                    ) : null}
                    <div
                      className={`absolute top-0 bottom-0 w-1 z-10 -translate-x-1/2 ${
                        isDarkMode ? 'bg-slate-950' : 'bg-white'
                      }`}
                      style={{ left: `${alertThreshold}%` }}
                    />
                  </div>
                  <div
                    className={`flex justify-between mt-2 ${TYPE.labelMd} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <span>0</span>
                    <span>50</span>
                    <span>100+</span>
                  </div>
                </div>
              </div>
            </div>

            <footer
              className={`mt-auto w-full shrink-0 border-t px-6 sm:px-8 pt-4 pb-4 ${
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              }`}
            >
              <SensitivitySlider
                isDarkMode={isDarkMode}
                theme={theme}
                sensitivity={sensitivity}
                setSensitivity={setSensitivity}
                bordered={false}
                trailing={
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl hover:-translate-y-1 active:scale-95 border-2 border-transparent ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                    title={isPaused ? 'Resume' : 'Pause'}
                    aria-label={isPaused ? 'Resume meter' : 'Pause meter'}
                  >
                    {isPaused ? (
                      <Play size={24} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                    ) : (
                      <Pause size={24} fill="currentColor" strokeWidth={0} />
                    )}
                  </button>
                }
              />
            </footer>
          </div>
        )}
      </div>
    </StageChrome>
  );
}
