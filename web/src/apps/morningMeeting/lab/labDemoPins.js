import { labFindFirstFit, labSeedSpan } from './boardLayoutLab';

/**
 * Starter demo pins for Layout Lab — a light mix under typical panel capacity.
 * Full catalog remains available via Add in the lab UI.
 */
export const LAB_DEMO_DEFS = [
  { id: 'lab-date', type: 'date', size: 'm' },
  { id: 'lab-weather', type: 'weather', size: 's' },
  { id: 'lab-message', type: 'message', size: 's' },
  { id: 'lab-attendance', type: 'attendance', size: 'l' },
  { id: 'lab-timer', type: 'timer', size: 's' },
];

/**
 * @param {typeof LAB_DEMO_DEFS} [defs]
 */
export function createLabDemoPins(defs = LAB_DEMO_DEFS) {
  const occupied = [];
  return defs.map((def) => {
    const pin = {
      id: def.id,
      type: def.type,
      size: def.size,
      orientation: 'horizontal',
      props: def.props || {},
    };
    const { w, h } = labSeedSpan(pin);
    const layout = labFindFirstFit(occupied, w, h);
    occupied.push(layout);
    return { ...pin, layout, layoutCustomized: false };
  });
}
