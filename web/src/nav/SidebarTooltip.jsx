import { TYPE } from '../shared/typography';

/**
 * Collapsed-rail hover label — surface chrome like ActionPopout / FitPopout
 * (avoids translucent colorPrimary fills such as emerald-500/80).
 */
export function SidebarTooltip({ tooltipInfo, theme }) {
  if (!tooltipInfo.visible) return null;

  return (
    <div
      role="tooltip"
      className={`fixed z-[100] px-3 py-2 ${TYPE.titleSm} rounded-xl pointer-events-none whitespace-nowrap shadow-xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
      style={{
        top: tooltipInfo.top,
        transform: 'translateY(-50%)',
        left: tooltipInfo.left,
        right: tooltipInfo.right,
      }}
    >
      {tooltipInfo.text}
    </div>
  );
}
