import { useEffect, useRef } from 'react';
import { MicPrompt } from '../MicPrompt';
import { SensitivitySlider, StageChrome } from '../StageChrome';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

/**
 * Block tower that wobbles and collapses when noise spikes.
 */
export function TowerView({
  theme,
  isDarkMode,
  hasPermission,
  permissionError,
  startMonitoring,
  dbLevel,
  currentDbRef,
  rebuildTowerTrigger,
  isFullScreen,
  setIsFullScreen,
  sensitivity,
  setSensitivity,
  alertThreshold,
  activeProfileName,
  isSustainedLoud,
  isSustainedLoudRef,
}) {
  const announce = useAnnounce();
  const announceRef = useRef(announce);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const blocksRef = useRef([]);
  const windRef = useRef([]);
  const isCollapsedRef = useRef(false);
  const alertThresholdRef = useRef(alertThreshold);

  useEffect(() => {
    announceRef.current = announce;
  }, [announce]);

  useEffect(() => {
    alertThresholdRef.current = alertThreshold;
  }, [alertThreshold]);

  const initTower = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - 60;
    const numBlocks = 12;
    const blockW = Math.min(80, canvas.width / 5);
    const blockH = 40;

    isCollapsedRef.current = false;
    blocksRef.current = Array.from({ length: numBlocks }).map((_, i) => {
      const hue = 210 - i * 15;
      return {
        id: i,
        baseX: canvas.width / 2,
        baseY: groundY - i * blockH - blockH / 2,
        x: canvas.width / 2,
        y: groundY - i * blockH - blockH / 2,
        width: blockW,
        height: blockH,
        vx: 0,
        vy: 0,
        va: 0,
        angle: 0,
        color: `hsl(${hue}, 80%, 55%)`,
        borderColor: `hsl(${hue}, 80%, 40%)`,
      };
    });

    windRef.current = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 60 + 20,
      speed: Math.random() * 8 + 4,
      thickness: Math.random() * 2 + 1,
    }));
  };

  useEffect(() => {
    initTower();
  }, [rebuildTowerTrigger]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvasRef.current) {
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
          if (!isCollapsedRef.current) initTower();
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [hasPermission, isFullScreen]);

  useEffect(() => {
    if (!hasPermission) return;
    let animationId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const currentDb = currentDbRef.current;
      const groundY = canvas.height - 60;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.strokeStyle = isDarkMode ? '#334155' : '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      const alertAt = alertThresholdRef.current;
      const isTooLoud = Boolean(isSustainedLoudRef?.current);
      const windStress = Math.max(0.1, currentDb / Math.max(alertAt, 1));
      const isBlowingHard = currentDb >= alertAt * 0.85;

      ctx.strokeStyle = isDarkMode
        ? `rgba(255, 255, 255, ${isBlowingHard ? 0.3 : 0.1})`
        : `rgba(0, 0, 0, ${isBlowingHard ? 0.15 : 0.05})`;

      windRef.current.forEach((p) => {
        p.x += p.speed * (windStress * 3);
        if (p.x > canvas.width) {
          p.x = -p.length;
          p.y = Math.random() * groundY;
        }
        ctx.lineWidth = p.thickness;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.length, p.y);
        ctx.stroke();
      });

      if (isTooLoud && !isCollapsedRef.current) {
        isCollapsedRef.current = true;
        announceRef.current?.('Tower collapsed');
        blocksRef.current.forEach((b, i) => {
          const heightFactor = (i + 1) / blocksRef.current.length;
          b.vx = (8 + Math.random() * 12) * heightFactor;
          b.vy = -2 - Math.random() * 4 * heightFactor;
          b.va = (Math.random() - 0.5) * 0.5;
        });
      }

      blocksRef.current.forEach((b, i) => {
        if (!isCollapsedRef.current) {
          const stressFactor = isTooLoud ? Math.pow(currentDb / alertAt, 3) : 0;
          const heightFactor = i / blocksRef.current.length;
          const jitterX = (Math.random() - 0.5) * 15 * stressFactor * heightFactor;
          const jitterAngle = (Math.random() - 0.5) * 0.2 * stressFactor * heightFactor;

          b.x = b.baseX + jitterX;
          b.angle = jitterAngle;
        } else {
          b.vy += 0.5;
          b.x += b.vx;
          b.y += b.vy;
          b.angle += b.va;

          if (b.y + b.height / 2 > groundY) {
            b.y = groundY - b.height / 2;
            b.vy *= -0.3;
            b.vx *= 0.8;
            b.va *= 0.8;
          }
          if (b.x + b.width / 2 > canvas.width) {
            b.x = canvas.width - b.width / 2;
            b.vx *= -0.5;
          }
          if (b.x - b.width / 2 < 0) {
            b.x = b.width / 2;
            b.vx *= -0.5;
          }
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeStyle = b.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-b.width / 2 + 2, -b.height / 2 + 2, b.width - 4, 6);

        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [hasPermission, currentDbRef, isSustainedLoudRef, isDarkMode]);

  const isLoud = isSustainedLoud || dbLevel >= alertThreshold;

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
                  ? 'text-rose-500 animate-pulse'
                  : isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
              }`}
            >
              Block Tower
            </h2>
            <p
              className={`${TYPE.bodyMd} text-center ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {activeProfileName
                ? `${activeProfileName} — keep voices low so the tower doesn't blow over!`
                : "Keep voices low so the tower doesn't blow over!"}
            </p>
          </div>
          <div ref={containerRef} className="flex-1 w-full relative min-h-0">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
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
