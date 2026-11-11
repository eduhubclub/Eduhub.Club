import { bestOnColor } from '../../shared/colorContrast';
import { scaleLevel } from '../../data/class-creator/classCreatorModel';

/** Style + contrast-safe ink for a rating cell fill. */
export function ratingSwatchStyle(schema, value, columnId) {
  const level = scaleLevel(schema, value, columnId);
  if (!level) return null;
  const on = bestOnColor(level.color);
  return {
    backgroundColor: level.color,
    color: on.hex,
    label: level.label,
    passesAA: on.passesAA,
  };
}
