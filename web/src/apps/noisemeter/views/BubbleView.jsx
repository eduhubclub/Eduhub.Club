import { useEffect, useRef } from 'react';
import { MicPrompt } from '../MicPrompt';
import { SensitivitySlider, StageChrome } from '../StageChrome';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

/**
 * Floating bubbles that pop when the room is too loud.
 * Zero bubbles = paused (not listening). Adding a bubble resumes listening.
 */
export function BubbleView({
  theme,
  isDarkMode,
  hasPermission,
  permissionError,
  startMonitoring,
  dbLevel,
  currentDbRef,
  addBubbleTrigger,
  isFullScreen,
  setIsFullScreen,
  sensitivity,
  setSensitivity,
  alertThreshold,
  activeProfileName,
  isSustainedLoud,
  isSustainedLoudRef,
  isPaused,
  setIsPaused,
}) {
  const announce = useAnnounce();
  const announceRef = useRef(announce);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const bubblesRef = useRef([]);
  const lastPopTimeRef = useRef(0);
  const alertThresholdRef = useRef(alertThreshold);
  const isPausedRef = useRef(isPaused);
  const setIsPausedRef = useRef(setIsPaused);

  useEffect(() => {
    announceRef.current = announce;
  }, [announce]);

  useEffect(() => {
    alertThresholdRef.current = alertThreshold;
  }, [alertThreshold]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    setIsPausedRef.current = setIsPaused;
  }, [setIsPaused]);

  // Enter Bubble Classroom paused until the teacher adds bubbles.
  useEffect(() => {
    setIsPaused?.(true);
    return () => {
      bubblesRef.current = [];
    };
  }, [setIsPaused]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvasRef.current) {
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [hasPermission, isFullScreen]);

  useEffect(() => {
    if (addBubbleTrigger > 0 && canvasRef.current) {
      const radius = Math.random() * 20 + 20;
      const canvas = canvasRef.current;
      bubblesRef.current.push({
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: canvas.height - radius - 10,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * -2 - 1,
        radius,
        popping: false,
        popProgress: 0,
        hue: Math.floor(Math.random() * 360),
      });
      setIsPaused?.(false);
    }
  }, [addBubbleTrigger, setIsPaused]);

  useEffect(() => {
    if (!hasPermission) return;
    let animationId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentDb = currentDbRef.current;
      const now = Date.now();
      const alertAt = alertThresholdRef.current;
      const listening =
        !isPausedRef.current && bubblesRef.current.length > 0;
      const isOverAlert =
        listening &&
        (currentDb >= alertAt || Boolean(isSustainedLoudRef?.current));

      if (isOverAlert && now - lastPopTimeRef.current > 2000) {
        const unpopped = bubblesRef.current.filter((b) => !b.popping);
        if (unpopped.length > 0) {
          const randomBubble =
            unpopped[Math.floor(Math.random() * unpopped.length)];
          randomBubble.popping = true;
          lastPopTimeRef.current = now;
          announceRef.current?.('Bubble popped');
        }
      }

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];

        if (b.popping) {
          b.popProgress += 0.08;
          b.radius += 1.5;

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - b.popProgress})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          for (let p = 0; p < 4; p++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(1 - b.popProgress) * 0.5})`;
            ctx.beginPath();
            ctx.arc(
              b.x + Math.cos((p * Math.PI) / 2) * b.radius * 0.8,
              b.y + Math.sin((p * Math.PI) / 2) * b.radius * 0.8,
              3,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }

          if (b.popProgress >= 1) {
            bubblesRef.current.splice(i, 1);
            if (bubblesRef.current.length === 0) {
              setIsPausedRef.current?.(true);
              announceRef.current?.('All bubbles popped');
            }
          }
        } else {
          b.vy -= 0.01;
          b.vx += (Math.random() - 0.5) * 0.1;

          if (b.vx > 2) b.vx = 2;
          if (b.vx < -2) b.vx = -2;
          if (b.vy < -3) b.vy = -3;
          if (b.vy > 2) b.vy = 2;

          b.x += b.vx;
          b.y += b.vy;

          if (b.x + b.radius > canvas.width) {
            b.x = canvas.width - b.radius;
            b.vx *= -0.8;
          }
          if (b.x - b.radius < 0) {
            b.x = b.radius;
            b.vx *= -0.8;
          }
          if (b.y + b.radius > canvas.height) {
            b.y = canvas.height - b.radius;
            b.vy *= -0.8;
          }
          if (b.y - b.radius < 0) {
            b.y = b.radius;
            b.vy *= -0.8;
          }

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${b.hue}, 80%, 60%, 0.15)`;
          ctx.fill();

          ctx.strokeStyle = `hsla(${b.hue}, 80%, 70%, 0.6)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(
            b.x - b.radius * 0.3,
            b.y - b.radius * 0.3,
            b.radius * 0.2,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [hasPermission, currentDbRef, isSustainedLoudRef]);

  const hasBubbles = !isPaused;
  const isLoud =
    hasBubbles && (isSustainedLoud || dbLevel >= alertThreshold);

  return (
    <StageChrome
      isDarkMode={isDarkMode}
      theme={theme}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
    >
      {!hasPermission ? (
        <div className="p-6 sm:p-8 h-full flex flex-col min-h-0">
          <MicPrompt
            isDarkMode={isDarkMode}
            theme={theme}
            onStart={startMonitoring}
            error={permissionError}
          />
        </div>
      ) : (
        <>
          <div className="absolute top-5 left-0 right-0 z-10 flex flex-col items-center pointer-events-none px-12">
            <h2
              className={`${TYPE.titleLg} mb-1 text-center ${
                isLoud
                  ? 'text-rose-500'
                  : isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
              }`}
            >
              Bubble Classroom
            </h2>
            <p
              className={`${TYPE.bodyMd} text-center ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {isPaused
                ? 'Add a bubble to start listening.'
                : activeProfileName
                  ? `${activeProfileName} — keep voices low to keep the bubbles floating!`
                  : 'Keep voices low to keep the bubbles floating!'}
            </p>
          </div>
          <div ref={containerRef} className="flex-1 w-full relative min-h-0">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full block"
            />
          </div>
          <SensitivitySlider
            isDarkMode={isDarkMode}
            theme={theme}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            className="px-6 pb-6 pr-20 md:pr-28"
          />
        </>
      )}
    </StageChrome>
  );
}
