/**
 * Edu.Hub shape library — rounded polygon paths from `material-shapes-ts`
 * (AndroidX graphics-shapes port). Use for badges and accents, not text-heavy
 * containers.
 */

import { MaterialShapes, roundedPolygonToPath } from 'material-shapes-ts';

/** @typedef {{ id: string, label: string, group: string }} ShapeDef */

const GROUP_BY_ID = {
  Circle: 'basic',
  Square: 'basic',
  Slanted: 'basic',
  Arch: 'basic',
  SemiCircle: 'basic',
  Oval: 'basic',
  Pill: 'basic',
  Triangle: 'polygons',
  Diamond: 'polygons',
  ClamShell: 'polygons',
  Pentagon: 'polygons',
  Gem: 'polygons',
  Arrow: 'polygons',
  Fan: 'polygons',
  Sunny: 'bursts',
  VerySunny: 'bursts',
  Burst: 'bursts',
  SoftBurst: 'bursts',
  Boom: 'bursts',
  SoftBoom: 'bursts',
  Cookie4Sided: 'cookies',
  Cookie6Sided: 'cookies',
  Cookie7Sided: 'cookies',
  Cookie9Sided: 'cookies',
  Cookie12Sided: 'cookies',
  Clover4Leaf: 'organic',
  Clover8Leaf: 'organic',
  Flower: 'organic',
  Puffy: 'organic',
  PuffyDiamond: 'organic',
  Bun: 'organic',
  Ghostish: 'organic',
  Heart: 'organic',
  PixelCircle: 'pixel',
  PixelTriangle: 'pixel',
};

export const SHAPE_GROUPS = [
  { id: 'basic', label: 'Basic' },
  { id: 'polygons', label: 'Polygons' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'bursts', label: 'Bursts' },
  { id: 'organic', label: 'Organic' },
  { id: 'pixel', label: 'Pixel' },
];

/** Human label from camel ids — Cookie9Sided → Cookie 9 sided. */
export function shapeLabel(id) {
  return String(id || '')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Z])/g, '$1 $2')
    .trim();
}

const PATH_CACHE = new Map();

/** Normalized 0..1 SVG path `d` for a shape id. */
export function shapePathData(id) {
  const key = String(id || 'Circle');
  if (PATH_CACHE.has(key)) return PATH_CACHE.get(key);
  const polygon =
    (typeof MaterialShapes.byName === 'function' && MaterialShapes.byName(key)) ||
    MaterialShapes[key] ||
    MaterialShapes.Circle;
  const d = roundedPolygonToPath(polygon).toSvgPathData();
  PATH_CACHE.set(key, d);
  return d;
}

/** @type {ShapeDef[]} */
export const SHAPES = (MaterialShapes.names || Object.keys(GROUP_BY_ID)).map((id) => ({
  id,
  label: shapeLabel(id),
  group: GROUP_BY_ID[id] || 'basic',
}));

const BY_ID = new Map(SHAPES.map((shape) => [shape.id, shape]));

/** @param {string} id */
export function getShape(id) {
  return BY_ID.get(id) || BY_ID.get('Circle');
}

/** True when id is a known library shape. */
export function isShapeId(id) {
  return BY_ID.has(String(id || ''));
}

/** Default accent shapes for Class Creator grade cards. */
export const DEFAULT_GRADE_SHAPES = {
  Kindergarten: 'Cookie9Sided',
  '1st Grade': 'SoftBurst',
  '2nd Grade': 'Clover4Leaf',
  '3rd Grade': 'Sunny',
  '4th Grade': 'Gem',
  '5th Grade': 'Flower',
  '6th Grade': 'Boom',
};

/**
 * Shape for a grade card — stored override or default by grade name.
 * @param {string} grade
 * @param {Record<string, string>} [gradeShapes]
 */
export function gradeShapeFor(grade, gradeShapes = {}) {
  const custom = String(gradeShapes?.[grade] || '').trim();
  if (custom && isShapeId(custom)) return custom;
  return DEFAULT_GRADE_SHAPES[grade] || 'Cookie9Sided';
}

/** @deprecated Use SHAPES */
export const MATERIAL_SHAPES = SHAPES;
/** @deprecated Use SHAPE_GROUPS */
export const MATERIAL_SHAPE_GROUPS = SHAPE_GROUPS;
/** @deprecated Use getShape */
export function getMaterialShape(id) {
  return getShape(id);
}
