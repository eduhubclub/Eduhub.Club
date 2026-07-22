import { TYPE } from '../shared/typography';

export function SidebarTooltip({ tooltipInfo, theme, isLeft }) {
  if (!tooltipInfo.visible) return null;

  return (
    <div
      className={`fixed z-[100] px-2 py-1 ${TYPE.labelMd} rounded-md pointer-events-none whitespace-nowrap shadow-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      style={{
        top: tooltipInfo.top,
        transform: 'translateY(-50%)',
        left: tooltipInfo.left,
        right: tooltipInfo.right,
      }}
    >
      {tooltipInfo.text}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 ${theme.colorPrimary} rotate-45 ${
          isLeft ? '-left-1' : '-right-1'
        }`}
      />
    </div>
  );
}
