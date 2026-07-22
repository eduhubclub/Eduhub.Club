import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlignJustify,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eraser,
  Eye,
  EyeOff,
  Grid,
  Grip,
  Highlighter,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Move,
  PaintBucket,
  PenTool,
  Presentation,
  RectangleHorizontal,
  Redo,
  Save,
  Square,
  Trash2,
  Type,
  Undo,
  X,
} from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { useLessons } from '../../data/lessons/LessonsContext';
import {
  appFabClass,
  APP_EMPTY_SLOT,
  APP_GRID_CARD,
  APP_SHELL_FOOTER_CHROME,
  APP_STAGE_SHELL,
  SHELL_MAIN_PADDING,
} from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  ANNOTATE_PALETTE,
  BOARD_NEUTRAL_HEX,
  PRIMARY_SOLID_HEX,
} from '../../shared/theme';
import { FitPopout } from '../../shared/usePopoutFit.jsx';
import { SaveWhiteboardModal } from './SaveWhiteboardModal';
import {
  createSavedWhiteboardId,
  deleteSavedWhiteboard,
  listSavedWhiteboards,
  upsertSavedWhiteboard,
} from '../../data/dashboard/savedWhiteboards';

// Math utilities for hit-testing strokes/shapes
const sqr = (x) => x * x;
const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
const distToSegmentSquared = (p, v, w) => {
  const l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};

const needsSwatchBorder = (color) =>
  color === BOARD_NEUTRAL_HEX.white || color === BOARD_NEUTRAL_HEX.slate;
/**
 * Edu.Dashboard whiteboard — drawing engine and annotate UI extracted from the POC.
 */
export function DashboardApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  isDesktop = true,
  onNavBadge,
  onShellFooterActiveChange,
  onSetActiveTab,
}) {
  const { selectedClass } = useClasses();
  const { getLessons, lessonsByClassId } = useLessons();

  const [isAnnotateMode, setIsAnnotateMode] = useState(false);
  const [annotateDockExpanded, setAnnotateDockExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolbarCompact, setToolbarCompact] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [annotateTool, setAnnotateTool] = useState('pen');
  const [annotateShapeType, setAnnotateShapeType] = useState('rectangle');
  const [showShapePicker, setShowShapePicker] = useState(false);
  /** null = transparent fill (default) */
  const [shapeFillColor, setShapeFillColor] = useState(null);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [annotateColor, setAnnotateColor] = useState(PRIMARY_SOLID_HEX.Red);
  const [annotateSize, setAnnotateSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAnnotationsVisible, setIsAnnotationsVisible] = useState(true);

  const [textInput, setTextInputState] = useState({
    active: false,
    x: 0,
    y: 0,
    text: '',
  });
  const textInputRef = useRef({ active: false, x: 0, y: 0, text: '' });
  const setTextInput = (val) => {
    const next = typeof val === 'function' ? val(textInputRef.current) : val;
    textInputRef.current = next;
    setTextInputState(next);
  };

  const [wbBackground, setWbBackground] = useState('plain');
  const [wbBackgroundSize, setWbBackgroundSize] = useState(24);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardPage, setWhiteboardPage] = useState(1);
  const [whiteboardTotalPages, setWhiteboardTotalPages] = useState(1);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedBoards, setSavedBoards] = useState(() => listSavedWhiteboards());

  const refreshSavedBoards = () => setSavedBoards(listSavedWhiteboards());

  const drawingsRef = useRef({});
  const currentPathRef = useRef(null);
  const draggingItemRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const shapePickerRef = useRef(null);
  const bgPickerRef = useRef(null);
  const colorPickerRef = useRef(null);
  const moreMenuRef = useRef(null);
  const eraserHasChangedRef = useRef(false);

  const historyRef = useRef({});
  const historyStepRef = useRef({});
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });

  const isWhiteboard = activeTab === 'Whiteboard';
  const isSavedWhiteboards = activeTab === 'Saved Whiteboards';

  useEffect(() => {
    onNavBadge?.('whiteboard', isWhiteboard ? `${whiteboardPage} / ${whiteboardTotalPages}` : null);
  }, [whiteboardPage, whiteboardTotalPages, isWhiteboard, onNavBadge]);

  useEffect(() => {
    if (isSavedWhiteboards) refreshSavedBoards();
  }, [isSavedWhiteboards]);

  const classLessons = getLessons(selectedClass?.id);
  const activeLesson =
    classLessons.find(
      (lesson) =>
        lesson.label === activeTab ||
        `Resource: ${lesson.label}` === activeTab
    ) ||
    Object.values(lessonsByClassId)
      .flat()
      .find(
        (lesson) =>
          lesson.label === activeTab ||
          `Resource: ${lesson.label}` === activeTab
      ) ||
    null;
  const activeContentLink = activeLesson?.link || null;
  const isLessonView = Boolean(activeContentLink);
  const activeDrawingKey = isWhiteboard
    ? `whiteboard-${whiteboardPage}`
    : `overlay-${activeTab || 'none'}`;

  const toolActive = `${theme.colorPrimary} ${theme.colorOnPrimary} shadow-md`;
  const toolIdle = isDarkMode
    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
    : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800';
  const toolBtn = (active) =>
    `w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
      active ? toolActive : toolIdle
    }`;
  const closeToolPopouts = ({ keep } = {}) => {
    if (keep !== 'color') setShowColorPicker(false);
    if (keep !== 'shape') {
      setShowShapePicker(false);
      setShowFillPicker(false);
    }
    if (keep !== 'bg') setShowBgPicker(false);
    if (keep !== 'more') setShowMoreMenu(false);
  };
  const selectAnnotateTool = (tool) => {
    closeToolPopouts();
    setAnnotateTool(tool);
  };
  const chromeBar = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} border border-slate-600 shadow-sm`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} border border-slate-300/80 shadow-sm`;
  const chromePop = isDarkMode
    ? `${theme.colorSurface} ${theme.colorOnSurface} border-slate-600 shadow-md`
    : `${theme.colorSurface} ${theme.colorOnSurface} border-slate-300 shadow-md`;
  const chromeDivider = isDarkMode ? 'bg-slate-700' : 'bg-slate-300/70';
  const chromeHover = isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200';
  const chromeMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const chromeDisabled = isDarkMode
    ? 'text-slate-600 cursor-not-allowed opacity-50'
    : 'text-slate-400 cursor-not-allowed opacity-50';
  const accentHover = theme.hoverText || 'hover:text-blue-400';
  const rangeInputClass = `h-1.5 appearance-none cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 bg-transparent ${theme.text}
    [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:border-0
    [&::-webkit-slider-thumb]:bg-current
    [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0
    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
    [&::-moz-range-thumb]:bg-current
    ${
      isDarkMode
        ? '[&::-webkit-slider-runnable-track]:bg-slate-600 [&::-moz-range-track]:bg-slate-600'
        : '[&::-webkit-slider-runnable-track]:bg-slate-200 [&::-moz-range-track]:bg-slate-200'
    }`;

  const updateHistoryUI = () => {
    const history = historyRef.current[activeDrawingKey] || [];
    const step = historyStepRef.current[activeDrawingKey] ?? -1;
    setHistoryState({
      canUndo: step > 0,
      canRedo: step >= 0 && step < history.length - 1,
    });
  };

  useEffect(() => {
    const key = activeDrawingKey;
    if (!historyRef.current[key]) {
      historyRef.current[key] = [
        JSON.parse(JSON.stringify(drawingsRef.current[key] || [])),
      ];
      historyStepRef.current[key] = 0;
    }
    updateHistoryUI();
  }, [activeDrawingKey]);

  useEffect(() => {
    const isInside = (ref, event) => {
      const node = ref.current;
      if (!node) return false;
      const path =
        typeof event.composedPath === 'function' ? event.composedPath() : [];
      return node.contains(event.target) || path.includes(node);
    };

    const handlePointerDown = (event) => {
      if (!isInside(shapePickerRef, event)) setShowShapePicker(false);
      if (!isInside(bgPickerRef, event)) setShowBgPicker(false);
      if (!isInside(colorPickerRef, event)) setShowColorPicker(false);
      if (!isInside(moreMenuRef, event)) setShowMoreMenu(false);
    };

    // Capture phase so canvas / other stopPropagation handlers can't block dismiss.
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = (width) => {
      // Condensed laptop/desktop shell: collapse overflow tools into ⋯ menu.
      // Phone/tablet (< md): keep the full bar and swipe-scroll instead.
      const next = isDesktop && width < 920 && !isFullscreen;
      setToolbarCompact(next);
      if (!next) setShowMoreMenu(false);
    };
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      update(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen, isDesktop]);

  useEffect(() => {
    if (!isAnnotateMode) {
      setAnnotateDockExpanded(false);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setAnnotateDockExpanded(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [isAnnotateMode]);

  const closeAnnotateMode = () => {
    setAnnotateDockExpanded(false);
    window.setTimeout(() => setIsAnnotateMode(false), 220);
  };

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (textInputRef.current?.active) return;
      setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const saveHistorySnapshot = () => {
    const key = activeDrawingKey;
    if (!historyRef.current[key]) {
      historyRef.current[key] = [[]];
      historyStepRef.current[key] = 0;
    }

    const currentDrawingsDeepCopy = JSON.parse(
      JSON.stringify(drawingsRef.current[key] || [])
    );
    let step = historyStepRef.current[key];
    let history = historyRef.current[key];

    if (step < history.length - 1) {
      history = history.slice(0, step + 1);
    }

    history.push(currentDrawingsDeepCopy);
    historyRef.current[key] = history;
    historyStepRef.current[key] = history.length - 1;
    updateHistoryUI();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isAnnotationsVisible) return;

    const drawings = drawingsRef.current[activeDrawingKey] || [];

    const renderObj = (obj) => {
      const isHighlight = obj.type === 'highlight';
      ctx.strokeStyle = isHighlight ? obj.color + '80' : obj.color;
      ctx.lineWidth = obj.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      if (obj.type === 'text') {
        ctx.font = `bold ${obj.size}px sans-serif`;
        ctx.fillStyle = obj.color;
        ctx.textBaseline = 'top';
        const lines = obj.text.split('\n');
        const lineHeight = obj.size * 1.2;
        lines.forEach((line, index) => {
          ctx.fillText(line, obj.x, obj.y + index * lineHeight);
        });
        return;
      }

      if (obj.type === 'shape') {
        if (obj.shapeType === 'rectangle' || obj.shapeType === 'square') {
          ctx.rect(obj.x, obj.y, obj.w, obj.h);
        } else if (
          obj.shapeType === 'ellipse' ||
          obj.shapeType === 'circle'
        ) {
          ctx.ellipse(
            obj.x + obj.w / 2,
            obj.y + obj.h / 2,
            Math.abs(obj.w / 2),
            Math.abs(obj.h / 2),
            0,
            0,
            2 * Math.PI
          );
        } else if (obj.shapeType === 'line' || obj.shapeType === 'arrow') {
          ctx.moveTo(obj.x, obj.y);
          ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
          if (obj.shapeType === 'arrow') {
            const angle = Math.atan2(obj.h, obj.w);
            const headlen = Math.max(15, obj.size * 3);
            ctx.lineTo(
              obj.x + obj.w - headlen * Math.cos(angle - Math.PI / 6),
              obj.y + obj.h - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(obj.x + obj.w, obj.y + obj.h);
            ctx.lineTo(
              obj.x + obj.w - headlen * Math.cos(angle + Math.PI / 6),
              obj.y + obj.h - headlen * Math.sin(angle + Math.PI / 6)
            );
          }
        }
        const canFill =
          obj.fill &&
          obj.shapeType !== 'line' &&
          obj.shapeType !== 'arrow';
        if (canFill) {
          ctx.fillStyle = obj.fill;
          ctx.fill();
        }
      } else if (obj.points && obj.points.length > 0) {
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
      }
      ctx.stroke();
    };

    drawings.forEach(renderObj);
    if (currentPathRef.current) renderObj(currentPathRef.current);
  };

  const undoDrawing = () => {
    const key = activeDrawingKey;
    const history = historyRef.current[key] || [];
    const step = historyStepRef.current[key] ?? -1;

    if (step > 0) {
      historyStepRef.current[key] = step - 1;
      drawingsRef.current[key] = JSON.parse(JSON.stringify(history[step - 1]));
      redrawCanvas();
      updateHistoryUI();
    }
  };

  const redoDrawing = () => {
    const key = activeDrawingKey;
    const history = historyRef.current[key] || [];
    const step = historyStepRef.current[key] ?? -1;

    if (step >= 0 && step < history.length - 1) {
      historyStepRef.current[key] = step + 1;
      drawingsRef.current[key] = JSON.parse(JSON.stringify(history[step + 1]));
      redrawCanvas();
      updateHistoryUI();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [isAnnotationsVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const updateSize = () => {
      const nextW = parent.clientWidth;
      const nextH = parent.clientHeight;
      // Skip while the board is keep-alive-hidden (0×0 would wipe the bitmap).
      if (nextW < 2 || nextH < 2) return;
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      redrawCanvas();
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [activeDrawingKey, isAnnotateMode, isDarkMode, isWhiteboard]);

  const getCanvasCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findHitObject = (coords, objects) => {
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const tol = Math.max(obj.size / 2, 8);

      if (obj.type === 'shape' || obj.type === 'text') {
        if (obj.shapeType === 'line' || obj.shapeType === 'arrow') {
          if (
            Math.sqrt(
              distToSegmentSquared(
                coords,
                { x: obj.x, y: obj.y },
                { x: obj.x + obj.w, y: obj.y + obj.h }
              )
            ) <= tol
          ) {
            return i;
          }
        } else {
          const left = Math.min(obj.x, obj.x + obj.w);
          const right = Math.max(obj.x, obj.x + obj.w);
          const top = Math.min(obj.y, obj.y + obj.h);
          const bottom = Math.max(obj.y, obj.y + obj.h);
          if (
            coords.x >= left - tol &&
            coords.x <= right + tol &&
            coords.y >= top - tol &&
            coords.y <= bottom + tol
          ) {
            return i;
          }
        }
      } else if (obj.points) {
        for (let j = 0; j < obj.points.length - 1; j++) {
          if (
            Math.sqrt(
              distToSegmentSquared(coords, obj.points[j], obj.points[j + 1])
            ) <= tol
          ) {
            return i;
          }
        }
      }
    }
    return -1;
  };

  const eraseAt = (coords) => {
    const eraseRadius = Math.max(12, annotateSize * 2);
    const eraseRadiusSq = eraseRadius * eraseRadius;
    const objects = drawingsRef.current[activeDrawingKey] || [];

    let hitIndex = -1;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      if (obj.type === 'shape' || obj.type === 'text') {
        if (obj.shapeType === 'line' || obj.shapeType === 'arrow') {
          const dSq = distToSegmentSquared(
            coords,
            { x: obj.x, y: obj.y },
            { x: obj.x + obj.w, y: obj.y + obj.h }
          );
          if (dSq <= eraseRadiusSq) {
            hitIndex = i;
            break;
          }
        } else {
          const left = Math.min(obj.x, obj.x + obj.w);
          const right = Math.max(obj.x, obj.x + obj.w);
          const top = Math.min(obj.y, obj.y + obj.h);
          const bottom = Math.max(obj.y, obj.y + obj.h);

          if (
            coords.x >= left - eraseRadius &&
            coords.x <= right + eraseRadius &&
            coords.y >= top - eraseRadius &&
            coords.y <= bottom + eraseRadius
          ) {
            hitIndex = i;
            break;
          }
        }
      } else if (obj.points && obj.points.length > 0) {
        const hitDistSq = eraseRadiusSq + Math.pow(obj.size / 2, 2);
        let foundHit = false;
        for (let j = 0; j < obj.points.length - 1; j++) {
          if (
            distToSegmentSquared(coords, obj.points[j], obj.points[j + 1]) <=
            hitDistSq
          ) {
            foundHit = true;
            break;
          }
        }
        if (foundHit) {
          hitIndex = i;
          break;
        }
      }
    }

    if (hitIndex !== -1) {
      eraserHasChangedRef.current = true;
      const obj = objects[hitIndex];
      let newObjects = [...objects.slice(0, hitIndex)];

      if (obj.type === 'shape' || obj.type === 'text') {
        // removed entirely
      } else if (obj.points && obj.points.length > 0) {
        let currentChunk = [];
        const chunks = [];
        const hitDistSq = eraseRadiusSq + Math.pow(obj.size / 2, 2);

        for (let j = 0; j < obj.points.length - 1; j++) {
          const p1 = obj.points[j];
          const p2 = obj.points[j + 1];
          const dSq = distToSegmentSquared(coords, p1, p2);

          if (dSq <= hitDistSq) {
            if (currentChunk.length > 1) {
              chunks.push(currentChunk);
            }
            currentChunk = [];
          } else {
            if (currentChunk.length === 0) {
              currentChunk.push(p1);
            }
            currentChunk.push(p2);
          }
        }
        if (currentChunk.length > 1) {
          chunks.push(currentChunk);
        }

        chunks.forEach((chunk) => {
          if (chunk.length > 0) {
            newObjects.push({ ...obj, points: chunk });
          }
        });
      }

      newObjects = newObjects.concat(objects.slice(hitIndex + 1));
      drawingsRef.current[activeDrawingKey] = newObjects;
      redrawCanvas();
    }
  };

  const commitText = () => {
    const current = textInputRef.current;
    if (!current.active) return;

    if (current.text.trim()) {
      const computedColor = isAnnotateMode
        ? annotateColor
        : isDarkMode
          ? '#ffffff'
          : '#0f172a';
      const fontSize = annotateSize * 4 + 12;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.font = `bold ${fontSize}px sans-serif`;

        const lines = current.text.split('\n');
        let maxWidth = 0;
        lines.forEach((line) => {
          const metrics = ctx.measureText(line);
          if (metrics.width > maxWidth) maxWidth = metrics.width;
        });
        const totalHeight = lines.length * (fontSize * 1.2);

        const key = activeDrawingKey;
        if (!drawingsRef.current[key]) drawingsRef.current[key] = [];

        drawingsRef.current[key].push({
          type: 'text',
          text: current.text,
          color: computedColor,
          size: fontSize,
          x: current.x,
          y: current.y,
          w: maxWidth,
          h: totalHeight,
        });

        redrawCanvas();
        saveHistorySnapshot();
      }
    }
    setTextInput({ active: false, x: 0, y: 0, text: '' });
  };

  useEffect(() => {
    if (
      (annotateTool !== 'text' || !isAnnotateMode) &&
      textInputRef.current.active
    ) {
      commitText();
    }
  }, [annotateTool, isAnnotateMode]);

  const startDrawing = (e) => {
    closeToolPopouts();

    if (!isAnnotationsVisible) setIsAnnotationsVisible(true);
    if (annotateTool === 'select' && !isWhiteboard) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(e, canvas);
    lastCoordsRef.current = coords;

    if (annotateTool === 'text') {
      if (e && e.preventDefault) e.preventDefault();
      if (textInputRef.current.active) commitText();
      setTextInput({ active: true, x: coords.x, y: coords.y, text: '' });
      setTimeout(() => {
        const el = document.getElementById('annotate-text-input');
        if (el) el.focus();
      }, 50);
      return;
    }

    if (annotateTool === 'move') {
      const objects = drawingsRef.current[activeDrawingKey] || [];
      const hitIndex = findHitObject(coords, objects);
      if (hitIndex !== -1) {
        draggingItemRef.current = {
          index: hitIndex,
          startX: coords.x,
          startY: coords.y,
        };
        setIsDrawing(true);
      }
      return;
    }

    if (annotateTool === 'eraser') {
      setIsDrawing(true);
      eraserHasChangedRef.current = false;
      eraseAt(coords);
      return;
    }

    const isHighlight = isAnnotateMode && annotateTool === 'highlight';
    const computedColor = isAnnotateMode
      ? annotateColor
      : isDarkMode
        ? '#ffffff'
        : '#0f172a';

    currentPathRef.current = {
      type: isAnnotateMode ? annotateTool : 'pen',
      shapeType: annotateTool === 'shape' ? annotateShapeType : null,
      color: computedColor,
      fill:
        annotateTool === 'shape' &&
        annotateShapeType !== 'line' &&
        annotateShapeType !== 'arrow'
          ? shapeFillColor
          : null,
      size: isHighlight
        ? annotateSize * 4
        : isAnnotateMode
          ? annotateSize
          : 4,
      points: [coords],
      x: coords.x,
      y: coords.y,
      w: 0,
      h: 0,
    };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(e, canvas);

    if (annotateTool === 'move') {
      if (draggingItemRef.current) {
        const { index, startX, startY } = draggingItemRef.current;
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const objects = drawingsRef.current[activeDrawingKey];
        const obj = objects[index];

        if (obj.type === 'shape' || obj.type === 'text') {
          obj.x += dx;
          obj.y += dy;
        } else if (obj.points) {
          obj.points.forEach((p) => {
            p.x += dx;
            p.y += dy;
          });
        }

        if (dx !== 0 || dy !== 0) draggingItemRef.current.hasMoved = true;

        draggingItemRef.current.startX = coords.x;
        draggingItemRef.current.startY = coords.y;
        redrawCanvas();
      }
      return;
    }

    if (annotateTool === 'eraser') {
      const dist = Math.sqrt(dist2(lastCoordsRef.current, coords));
      const steps = Math.max(1, Math.floor(dist / 5));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const interpCoords = {
          x:
            lastCoordsRef.current.x +
            (coords.x - lastCoordsRef.current.x) * t,
          y:
            lastCoordsRef.current.y +
            (coords.y - lastCoordsRef.current.y) * t,
        };
        eraseAt(interpCoords);
      }
      lastCoordsRef.current = coords;
      return;
    }

    if (currentPathRef.current) {
      if (currentPathRef.current.type === 'shape') {
        let dx = coords.x - currentPathRef.current.x;
        let dy = coords.y - currentPathRef.current.y;

        if (
          currentPathRef.current.shapeType === 'square' ||
          currentPathRef.current.shapeType === 'circle'
        ) {
          const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
          dx = maxDist * (Math.sign(dx) || 1);
          dy = maxDist * (Math.sign(dy) || 1);
        }

        currentPathRef.current.w = dx;
        currentPathRef.current.h = dy;
      } else {
        currentPathRef.current.points.push(coords);
      }
      redrawCanvas();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    let actionHappened = false;

    if (annotateTool === 'move') {
      if (draggingItemRef.current && draggingItemRef.current.hasMoved) {
        actionHappened = true;
      }
      draggingItemRef.current = null;
    } else if (annotateTool === 'eraser') {
      if (eraserHasChangedRef.current) actionHappened = true;
    } else if (currentPathRef.current) {
      if (!drawingsRef.current[activeDrawingKey]) {
        drawingsRef.current[activeDrawingKey] = [];
      }
      drawingsRef.current[activeDrawingKey].push(currentPathRef.current);
      currentPathRef.current = null;
      actionHappened = true;
    }

    setIsDrawing(false);
    redrawCanvas();

    if (actionHappened) {
      saveHistorySnapshot();
    }
  };

  const clearAllDrawings = () => {
    const key = activeDrawingKey;
    if (drawingsRef.current[key] && drawingsRef.current[key].length > 0) {
      drawingsRef.current[key] = [];
      redrawCanvas();
      saveHistorySnapshot();
    }
  };

  const renderExportCanvas = () => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    if (isWhiteboard) {
      ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = isDarkMode
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)';
      ctx.fillStyle = isDarkMode
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(0,0,0,0.15)';

      if (wbBackground === 'grid') {
        ctx.beginPath();
        for (let x = 0; x <= tempCanvas.width; x += wbBackgroundSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, tempCanvas.height);
        }
        for (let y = 0; y <= tempCanvas.height; y += wbBackgroundSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(tempCanvas.width, y);
        }
        ctx.stroke();
      } else if (wbBackground === 'dots') {
        for (
          let x = wbBackgroundSize / 2;
          x <= tempCanvas.width;
          x += wbBackgroundSize
        ) {
          for (
            let y = wbBackgroundSize / 2;
            y <= tempCanvas.height;
            y += wbBackgroundSize
          ) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (wbBackground === 'lines') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDarkMode
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        for (let y = wbBackgroundSize; y <= tempCanvas.height; y += wbBackgroundSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(tempCanvas.width, y);
        }
        ctx.stroke();
      }
    }

    ctx.drawImage(canvas, 0, 0);
    return tempCanvas;
  };

  const downloadCurrentPage = () => {
    const tempCanvas = renderExportCanvas();
    if (!tempCanvas) return;

    const link = document.createElement('a');
    const safeTabName = activeTab
      ? activeTab.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'canvas';
    const pageSuffix = isWhiteboard ? `-page-${whiteboardPage}` : '';

    link.download = `eduhub-${safeTabName}${pageSuffix}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const saveWhiteboardToLibrary = (name) => {
    const pages = {};
    for (let page = 1; page <= whiteboardTotalPages; page += 1) {
      const key = `whiteboard-${page}`;
      pages[String(page)] = JSON.parse(
        JSON.stringify(drawingsRef.current[key] || [])
      );
    }

    const now = Date.now();
    upsertSavedWhiteboard({
      id: createSavedWhiteboardId(),
      name,
      createdAt: now,
      updatedAt: now,
      totalPages: whiteboardTotalPages,
      background: wbBackground,
      backgroundSize: wbBackgroundSize,
      pages,
    });
    refreshSavedBoards();
    onSetActiveTab?.('Saved Whiteboards');
  };

  const openSavedWhiteboard = (board) => {
    Object.keys(drawingsRef.current).forEach((key) => {
      if (key.startsWith('whiteboard-')) delete drawingsRef.current[key];
    });
    Object.keys(historyRef.current).forEach((key) => {
      if (key.startsWith('whiteboard-')) delete historyRef.current[key];
    });
    Object.keys(historyStepRef.current).forEach((key) => {
      if (key.startsWith('whiteboard-')) delete historyStepRef.current[key];
    });

    const total = Math.max(1, board.totalPages || 1);
    for (let page = 1; page <= total; page += 1) {
      const key = `whiteboard-${page}`;
      const drawing = JSON.parse(
        JSON.stringify(board.pages?.[String(page)] || board.pages?.[page] || [])
      );
      drawingsRef.current[key] = drawing;
      historyRef.current[key] = [JSON.parse(JSON.stringify(drawing))];
      historyStepRef.current[key] = 0;
    }

    setWbBackground(board.background || 'plain');
    setWbBackgroundSize(board.backgroundSize || 24);
    setWhiteboardTotalPages(total);
    setWhiteboardPage(1);
    setIsAnnotateMode(false);
    onSetActiveTab?.('Whiteboard');
  };

  const removeSavedWhiteboard = (id) => {
    deleteSavedWhiteboard(id);
    refreshSavedBoards();
  };

  const openSaveModal = () => setShowSaveModal(true);

  const handlePageChange = (direction) => {
    if (direction === 'next') {
      if (whiteboardPage === whiteboardTotalPages) {
        setWhiteboardTotalPages((prev) => prev + 1);
      }
      setWhiteboardPage((prev) => prev + 1);
    } else if (direction === 'prev' && whiteboardPage > 1) {
      setWhiteboardPage((prev) => prev - 1);
    }
  };

  const getWhiteboardBgStyle = () => {
    if (!isWhiteboard) return {};
    const color = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const dotColor = isDarkMode
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(0,0,0,0.15)';
    const lineColor = isDarkMode
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(0,0,0,0.15)';

    if (wbBackground === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: `${wbBackgroundSize}px ${wbBackgroundSize}px`,
      };
    }
    if (wbBackground === 'dots') {
      return {
        backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: `${wbBackgroundSize}px ${wbBackgroundSize}px`,
        backgroundPosition: `${wbBackgroundSize / 2}px ${wbBackgroundSize / 2}px`,
      };
    }
    if (wbBackground === 'lines') {
      return {
        backgroundImage: `linear-gradient(transparent ${wbBackgroundSize - 2}px, ${lineColor} ${wbBackgroundSize - 2}px, ${lineColor} ${wbBackgroundSize}px)`,
        backgroundSize: `100% ${wbBackgroundSize}px`,
      };
    }
    return {};
  };

  const getCursorClass = () => {
    if (annotateTool === 'select' && !isWhiteboard) return 'pointer-events-none';
    if (annotateTool === 'move') return 'cursor-move';
    if (annotateTool === 'text') return 'cursor-text';
    return 'cursor-crosshair';
  };

  const whiteboardToolbarControls = isWhiteboard ? (
    <>
      <button
        type="button"
        onClick={() => handlePageChange('prev')}
        disabled={whiteboardPage === 1}
        className={`edu-control w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
          whiteboardPage === 1
            ? chromeDisabled
            : `${chromeMuted} ${chromeHover}`
        }`}
        title="Previous page"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      <span
        className={`${TYPE.labelMicro} tabular-nums px-1 shrink-0 font-medium ${theme.colorOnSurfaceVariant}`}
        aria-live="polite"
      >
        {whiteboardPage} / {whiteboardTotalPages}
      </span>

      <button
        type="button"
        onClick={() => handlePageChange('next')}
        className={`edu-control w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${chromeMuted} ${chromeHover}`}
        title={
          whiteboardPage >= whiteboardTotalPages ? 'New page' : 'Next page'
        }
        aria-label={
          whiteboardPage >= whiteboardTotalPages ? 'New page' : 'Next page'
        }
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>

      <div className={`w-[1px] h-5 mx-0.5 shrink-0 ${chromeDivider}`} />

      <button
        type="button"
        onClick={() => setIsFullscreen((v) => !v)}
        className={`edu-control w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
          isFullscreen ? toolActive : `${chromeMuted} ${chromeHover}`
        }`}
        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
        aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {isFullscreen ? (
          <Minimize2 size={16} strokeWidth={2.5} />
        ) : (
          <Maximize2 size={16} strokeWidth={2.5} />
        )}
      </button>
    </>
  ) : null;

  const textAreaStyle = textInput.active
    ? {
        position: 'absolute',
        left: textInput.x,
        top: textInput.y,
        color: isAnnotateMode
          ? annotateColor
          : isDarkMode
            ? '#ffffff'
            : '#0f172a',
        fontSize: `${annotateSize * 4 + 12}px`,
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        background: 'transparent',
        border: `1px dashed ${isDarkMode ? '#475569' : '#94a3b8'}`,
        outline: 'none',
        padding: 0,
        margin: 0,
        zIndex: 65,
        resize: 'none',
        overflow: 'hidden',
        lineHeight: 1.2,
        whiteSpace: 'pre',
        width: `${
          Math.max(
            50,
            Math.max(
              ...(textInput.text || ' ').split('\n').map((l) => l.length)
            ) *
              (annotateSize * 2.5 + 8) +
              20
          )
        }px`,
        height: `${
          (textInput.text || ' ').split('\n').length *
            (annotateSize * 4 + 12) *
            1.2 +
          20
        }px`,
      }
    : undefined;

  const annotateToolbarTools = (
    <>
      <button
        type="button"
        onClick={() => selectAnnotateTool('select')}
        className={toolBtn(annotateTool === 'select')}
        title="Select Tool (Interact with content)"
      >
        <MousePointer2 size={16} />
      </button>

      <button
        type="button"
        onClick={() => selectAnnotateTool('move')}
        className={toolBtn(annotateTool === 'move')}
        title="Move Drawings"
      >
        <Move size={16} />
      </button>

      <div className={`hidden lg:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

      <button
        type="button"
        onClick={() => selectAnnotateTool('pen')}
        className={toolBtn(annotateTool === 'pen')}
        title="Pen Tool"
      >
        <PenTool size={16} />
      </button>

      <button
        type="button"
        onClick={() => selectAnnotateTool('highlight')}
        className={toolBtn(annotateTool === 'highlight')}
        title="Highlight Tool"
      >
        <Highlighter size={16} />
      </button>

      <button
        type="button"
        onClick={() => selectAnnotateTool('text')}
        className={toolBtn(annotateTool === 'text')}
        title="Text Tool"
      >
        <Type size={16} />
      </button>

      <div className="relative flex flex-col items-center" ref={shapePickerRef}>
        <button
          type="button"
          onClick={() => {
            if (annotateTool === 'shape') {
              closeToolPopouts({ keep: 'shape' });
              setShowShapePicker((open) => {
                if (open) setShowFillPicker(false);
                return !open;
              });
            } else {
              selectAnnotateTool('shape');
              setShowShapePicker(false);
              setShowFillPicker(false);
            }
          }}
          className={toolBtn(annotateTool === 'shape')}
          title="Shape Tool (Click again for more options)"
        >
          {annotateShapeType === 'square' && <Square size={16} />}
          {annotateShapeType === 'rectangle' && (
            <RectangleHorizontal size={16} />
          )}
          {annotateShapeType === 'circle' && <Circle size={16} />}
          {annotateShapeType === 'ellipse' && (
            <Circle size={16} className="scale-x-125" />
          )}
          {annotateShapeType === 'line' && (
            <Minus size={16} className="rotate-45" />
          )}
          {annotateShapeType === 'arrow' && (
            <ArrowRight size={16} className="-rotate-45" />
          )}
          {!['square', 'rectangle', 'circle', 'ellipse', 'line', 'arrow'].includes(
            annotateShapeType
          ) && <RectangleHorizontal size={16} />}
        </button>

        {showShapePicker && (
          <FitPopout
            open={showShapePicker}
            className={`absolute bottom-full mb-5 flex items-center gap-1 p-1 sm:gap-2 sm:p-2 rounded-2xl shadow-xl z-[130] border ${chromePop}`}
          >
            {[
              {
                type: 'rectangle',
                icon: <RectangleHorizontal size={16} />,
                title: 'Rectangle',
              },
              { type: 'square', icon: <Square size={16} />, title: 'Square' },
              {
                type: 'ellipse',
                icon: <Circle size={16} className="scale-x-125" />,
                title: 'Ellipse',
              },
              { type: 'circle', icon: <Circle size={16} />, title: 'Circle' },
              {
                type: 'line',
                icon: <Minus size={16} className="rotate-45" />,
                title: 'Line',
              },
              {
                type: 'arrow',
                icon: <ArrowRight size={16} className="-rotate-45" />,
                title: 'Arrow',
              },
            ].map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => {
                  setAnnotateShapeType(s.type);
                  selectAnnotateTool('shape');
                  setShowFillPicker(false);
                  setShowShapePicker(false);
                }}
                title={s.title}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors ${chromeHover} ${
                  annotateShapeType === s.type ? theme.text : chromeMuted
                }`}
              >
                {s.icon}
              </button>
            ))}

            <div className={`w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFillPicker((open) => !open);
                }}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors ${chromeHover} ${
                  shapeFillColor ? theme.text : chromeMuted
                }`}
                title="Shape fill (default transparent)"
              >
                <span className="relative inline-flex items-center justify-center w-4 h-4">
                  <PaintBucket size={16} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border ${
                      isDarkMode ? 'border-slate-600' : 'border-slate-300'
                    }`}
                    style={{
                      backgroundColor: shapeFillColor || 'transparent',
                      backgroundImage: shapeFillColor
                        ? undefined
                        : 'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)',
                      backgroundSize: shapeFillColor
                        ? undefined
                        : '4px 4px',
                      backgroundPosition: shapeFillColor
                        ? undefined
                        : '0 0, 0 2px, 2px -2px, -2px 0',
                    }}
                  />
                </span>
              </button>

              {showFillPicker && (
                <FitPopout
                  open={showFillPicker}
                  centerX
                  className={`absolute bottom-full mb-3 left-1/2 flex flex-nowrap items-center gap-2 p-2.5 rounded-full shadow-xl z-[130] border ${chromePop}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShapeFillColor(null);
                      setShowFillPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full shrink-0 border transition-transform hover:scale-110 ${
                      isDarkMode ? 'border-slate-500' : 'border-slate-400'
                    } ${
                      shapeFillColor === null
                        ? `ring-2 ring-offset-2 ${
                            isDarkMode
                              ? 'ring-white ring-offset-slate-900'
                              : 'ring-slate-700 ring-offset-white'
                          }`
                        : ''
                    }`}
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0',
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    }}
                    title="Transparent"
                  />
                  {ANNOTATE_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setShapeFillColor(color);
                        setShowFillPicker(false);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0 ${
                        needsSwatchBorder(color) ? 'border border-slate-400' : ''
                      } ${
                        shapeFillColor === color
                          ? `ring-2 ring-offset-2 ${
                              isDarkMode
                                ? 'ring-white ring-offset-slate-900'
                                : 'ring-slate-700 ring-offset-white'
                            }`
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </FitPopout>
              )}
            </div>
          </FitPopout>
        )}
      </div>

      <button
        type="button"
        onClick={() => selectAnnotateTool('eraser')}
        className={toolBtn(annotateTool === 'eraser')}
        title="Eraser Tool (Splits Lines)"
      >
        <Eraser size={16} />
      </button>

      <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

      <div className="relative" ref={colorPickerRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeToolPopouts({ keep: 'color' });
            setShowColorPicker((open) => !open);
          }}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${chromeHover}`}
          title="Color Selector"
        >
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-inner"
            style={{ backgroundColor: annotateColor }}
          />
        </button>

        {showColorPicker && (
          <FitPopout
            open={showColorPicker}
            centerX
            className={`absolute bottom-full mb-5 left-1/2 flex flex-nowrap items-center gap-2 p-2.5 sm:p-3 rounded-full shadow-xl z-[130] border ${chromePop}`}
          >
            {ANNOTATE_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setAnnotateColor(color);
                  setShowColorPicker(false);
                }}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0 ${
                  needsSwatchBorder(color) ? 'border border-slate-400' : ''
                } ${
                  annotateColor === color
                    ? `ring-2 ring-offset-2 ${
                        isDarkMode
                          ? 'ring-white ring-offset-slate-900'
                          : 'ring-slate-700 ring-offset-slate-100'
                      }`
                    : ''
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </FitPopout>
        )}
      </div>

      {!toolbarCompact && (
        <>
          {isWhiteboard && (
            <>
              <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />
              <div className="relative flex flex-col items-center" ref={bgPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className={toolBtn(wbBackground !== 'plain')}
                  title="Canvas Background"
                >
                  <LayoutGrid size={16} />
                </button>

                {showBgPicker && (
                  <FitPopout
                    open={showBgPicker}
                    className={`absolute bottom-full mb-5 flex flex-col gap-2 p-2 rounded-2xl shadow-xl z-[130] border ${chromePop}`}
                  >
                    <div className="flex gap-1">
                      {[
                        { id: 'plain', icon: <Square size={16} />, title: 'Plain' },
                        { id: 'grid', icon: <Grid size={16} />, title: 'Grid' },
                        { id: 'dots', icon: <Grip size={16} />, title: 'Dots' },
                        {
                          id: 'lines',
                          icon: <AlignJustify size={16} />,
                          title: 'Lines',
                        },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            setWbBackground(bg.id);
                            if (bg.id === 'plain') setShowBgPicker(false);
                          }}
                          title={bg.title}
                          className={`p-1.5 rounded-xl transition-colors ${chromeHover} ${
                            wbBackground === bg.id
                              ? `${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'} ${theme.text}`
                              : chromeMuted
                          }`}
                        >
                          {bg.icon}
                        </button>
                      ))}
                    </div>

                    {wbBackground !== 'plain' && (
                      <>
                        <div className={`w-full h-[1px] ${chromeDivider}`} />
                        <div
                          className="flex items-center justify-between gap-2 px-1"
                          title="Adjust Background Spacing"
                        >
                          <Minus size={14} className="text-slate-500 shrink-0" />
                          <input
                            type="range"
                            min="12"
                            max="120"
                            step="4"
                            value={wbBackgroundSize}
                            onChange={(e) =>
                              setWbBackgroundSize(parseInt(e.target.value, 10))
                            }
                            className={`w-20 ${rangeInputClass}`}
                          />
                          <LayoutGrid
                            size={14}
                            className="text-slate-500 shrink-0"
                          />
                        </div>
                      </>
                    )}
                  </FitPopout>
                )}
              </div>
            </>
          )}

          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

          <div
            className="flex items-center gap-1 px-1 sm:px-2 h-8 sm:h-9"
            title="Adjust Pen/Highlighter/Eraser Size"
          >
            <input
              type="range"
              min="1"
              max="20"
              value={annotateSize}
              onChange={(e) => setAnnotateSize(parseInt(e.target.value, 10))}
              className={`w-16 sm:w-20 ${rangeInputClass}`}
            />
          </div>

          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

          <button
            type="button"
            onClick={undoDrawing}
            disabled={!historyState.canUndo}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
              historyState.canUndo
                ? `${chromeMuted} ${accentHover} ${chromeHover}`
                : chromeDisabled
            }`}
            title="Undo"
          >
            <Undo size={16} />
          </button>

          <button
            type="button"
            onClick={redoDrawing}
            disabled={!historyState.canRedo}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
              historyState.canRedo
                ? `${chromeMuted} ${accentHover} ${chromeHover}`
                : chromeDisabled
            }`}
            title="Redo"
          >
            <Redo size={16} />
          </button>

          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

          <button
            type="button"
            onClick={() => setIsAnnotationsVisible(!isAnnotationsVisible)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
              !isAnnotationsVisible
                ? 'bg-amber-500 text-white shadow-md'
                : `${chromeMuted} hover:text-amber-500 ${chromeHover}`
            }`}
            title={isAnnotationsVisible ? 'Hide Annotations' : 'Show Annotations'}
          >
            {isAnnotationsVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

          <button
            type="button"
            onClick={clearAllDrawings}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${chromeMuted} hover:text-rose-500 hover:bg-rose-500/20 transition-colors`}
            title="Clear All Annotations"
          >
            <Trash2 size={16} />
          </button>

          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />

          <button
            type="button"
            onClick={openSaveModal}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${chromeMuted} hover:text-emerald-500 hover:bg-emerald-500/20 transition-colors`}
            title="Save"
          >
            <Save size={16} />
          </button>
        </>
      )}

      {toolbarCompact && (
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu((v) => !v)}
            className={toolBtn(showMoreMenu)}
            title="More tools"
            aria-label="More tools"
            aria-expanded={showMoreMenu}
          >
            <MoreHorizontal size={16} />
          </button>

          {showMoreMenu && (
            <FitPopout
              open={showMoreMenu}
              className={`absolute bottom-full mb-5 right-0 flex flex-nowrap items-center gap-1.5 p-2 rounded-2xl shadow-xl z-[130] border ${chromePop}`}
            >
              {isWhiteboard && (
                <div className="relative flex flex-col items-center" ref={bgPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowBgPicker(!showBgPicker)}
                    className={toolBtn(wbBackground !== 'plain')}
                    title="Canvas Background"
                  >
                    <LayoutGrid size={16} />
                  </button>

                  {showBgPicker && (
                    <FitPopout
                      open={showBgPicker}
                      className={`absolute bottom-full mb-3 right-0 flex flex-col gap-2 p-2 rounded-2xl shadow-xl z-[130] border ${chromePop}`}
                    >
                      <div className="flex gap-1">
                        {[
                          { id: 'plain', icon: <Square size={16} />, title: 'Plain' },
                          { id: 'grid', icon: <Grid size={16} />, title: 'Grid' },
                          { id: 'dots', icon: <Grip size={16} />, title: 'Dots' },
                          {
                            id: 'lines',
                            icon: <AlignJustify size={16} />,
                            title: 'Lines',
                          },
                        ].map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => {
                              setWbBackground(bg.id);
                              if (bg.id === 'plain') setShowBgPicker(false);
                            }}
                            title={bg.title}
                            className={`p-1.5 rounded-xl transition-colors ${chromeHover} ${
                              wbBackground === bg.id
                                ? `${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'} ${theme.text}`
                                : chromeMuted
                            }`}
                          >
                            {bg.icon}
                          </button>
                        ))}
                      </div>

                      {wbBackground !== 'plain' && (
                        <>
                          <div className={`w-full h-[1px] ${chromeDivider}`} />
                          <div
                            className="flex items-center justify-between gap-2 px-1"
                            title="Adjust Background Spacing"
                          >
                            <Minus size={14} className="text-slate-500 shrink-0" />
                            <input
                              type="range"
                              min="12"
                              max="120"
                              step="4"
                              value={wbBackgroundSize}
                              onChange={(e) =>
                                setWbBackgroundSize(parseInt(e.target.value, 10))
                              }
                              className={`w-20 ${rangeInputClass}`}
                            />
                            <LayoutGrid
                              size={14}
                              className="text-slate-500 shrink-0"
                            />
                          </div>
                        </>
                      )}
                    </FitPopout>
                  )}
                </div>
              )}

              <div
                className="flex items-center gap-1 px-1 h-8 sm:h-9"
                title="Adjust Pen/Highlighter/Eraser Size"
              >
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={annotateSize}
                  onChange={(e) => setAnnotateSize(parseInt(e.target.value, 10))}
                  className={`w-16 ${rangeInputClass}`}
                />
              </div>

              <button
                type="button"
                onClick={undoDrawing}
                disabled={!historyState.canUndo}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
                  historyState.canUndo
                    ? `${chromeMuted} ${accentHover} ${chromeHover}`
                    : chromeDisabled
                }`}
                title="Undo"
              >
                <Undo size={16} />
              </button>

              <button
                type="button"
                onClick={redoDrawing}
                disabled={!historyState.canRedo}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
                  historyState.canRedo
                    ? `${chromeMuted} ${accentHover} ${chromeHover}`
                    : chromeDisabled
                }`}
                title="Redo"
              >
                <Redo size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsAnnotationsVisible(!isAnnotationsVisible)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                  !isAnnotationsVisible
                    ? 'bg-amber-500 text-white shadow-md'
                    : `${chromeMuted} hover:text-amber-500 ${chromeHover}`
                }`}
                title={
                  isAnnotationsVisible ? 'Hide Annotations' : 'Show Annotations'
                }
              >
                {isAnnotationsVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>

              <button
                type="button"
                onClick={clearAllDrawings}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${chromeMuted} hover:text-rose-500 hover:bg-rose-500/20 transition-colors`}
                title="Clear All Annotations"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={openSaveModal}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${chromeMuted} hover:text-emerald-500 hover:bg-emerald-500/20 transition-colors`}
                title="Save"
              >
                <Save size={16} />
              </button>
            </FitPopout>
          )}
        </div>
      )}

      {whiteboardToolbarControls && (
        <>
          <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />
          {whiteboardToolbarControls}
        </>
      )}

      <div className={`hidden sm:block w-[1px] h-5 mx-0.5 ${chromeDivider}`} />
    </>
  );

  const annotateCloseBtn = (
    <button
      type="button"
      onClick={closeAnnotateMode}
      className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center ${chromeMuted} hover:text-rose-500 hover:bg-rose-500/20 transition-colors`}
      title="Close Annotation"
      aria-label="Close annotate tools"
    >
      <X size={16} />
    </button>
  );

  const showAnnotateFooter = isAnnotateMode && (isWhiteboard || isLessonView);
  const toolbarSwipe = !isDesktop;
  const annotatePopoutOpen =
    showColorPicker ||
    showShapePicker ||
    showFillPicker ||
    showBgPicker ||
    showMoreMenu;

  useEffect(() => {
    if (!onShellFooterActiveChange) return undefined;
    onShellFooterActiveChange(showAnnotateFooter && !isFullscreen);
    return () => onShellFooterActiveChange(false);
  }, [showAnnotateFooter, isFullscreen, onShellFooterActiveChange]);

  const annotateFooterBar = showAnnotateFooter ? (
    <div
      className={`${APP_SHELL_FOOTER_CHROME} relative z-[120] overflow-visible ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div
        className={`flex w-full min-h-12 items-center gap-1 sm:gap-1.5 px-1 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          annotateDockExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${
          toolbarSwipe
            ? annotatePopoutOpen
              ? 'justify-start overflow-visible'
              : 'justify-start overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'justify-center overflow-visible'
        }`}
      >
        {annotateToolbarTools}
        {annotateCloseBtn}
      </div>
    </div>
  ) : null;

  const [mainFooterSlot, setMainFooterSlot] = useState(null);
  const [shellOverlaySlot, setShellOverlaySlot] = useState(null);

  useLayoutEffect(() => {
    if (!showAnnotateFooter || isFullscreen) {
      setMainFooterSlot(null);
      return;
    }
    setMainFooterSlot(document.getElementById('edu-main-footer'));
  }, [showAnnotateFooter, isFullscreen]);

  useLayoutEffect(() => {
    if (isFullscreen || isAnnotateMode || !(isWhiteboard || isLessonView)) {
      setShellOverlaySlot(null);
      return;
    }
    setShellOverlaySlot(document.getElementById('edu-shell-overlays'));
  }, [isFullscreen, isAnnotateMode, isWhiteboard, isLessonView]);

  const annotateFab =
    (isWhiteboard || isLessonView) && !isAnnotateMode ? (
      <button
        type="button"
        onClick={() => setIsAnnotateMode(true)}
        className={`pointer-events-auto ${appFabClass(isLeft)} z-[110] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        title="Open Annotate Tools"
        aria-label="Open annotate tools"
      >
        <PenTool size={24} strokeWidth={2.5} />
      </button>
    ) : null;

  const annotateCanvas = (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-[60] w-full h-full touch-none ${getCursorClass()}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {textInput.active && (
        <textarea
          id="annotate-text-input"
          autoFocus
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') commitText();
          }}
          style={textAreaStyle}
        />
      )}
    </>
  );

  const lessonViewer = activeContentLink ? (
    <div
      className={`relative w-full flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border ${
        isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'
      }`}
    >
      <div className="absolute top-3 right-3 z-[70] flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode
              ? 'bg-slate-800/90 text-slate-300 hover:text-white'
              : 'bg-slate-100/95 text-slate-500 hover:text-slate-800'
          }`}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {isFullscreen ? (
            <Minimize2 size={18} strokeWidth={2.5} />
          ) : (
            <Maximize2 size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {activeContentLink.startsWith('blob:') ? (
        activeContentLink.endsWith('#pdf') ? (
          <object
            data={activeContentLink.replace('#pdf', '')}
            type="application/pdf"
            className="w-full h-full border-0 flex-1 bg-slate-100"
            title={activeTab}
          >
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
              <p className={`${TYPE.bodyMd} text-slate-500`}>
                Inline PDF preview is blocked. Download to view.
              </p>
              <a
                href={activeContentLink.replace('#pdf', '')}
                download={activeLesson?.label || 'file.pdf'}
                className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Download PDF
              </a>
            </div>
          </object>
        ) : activeContentLink.endsWith('#img') ? (
          <div className="w-full h-full flex-1 p-6 flex items-center justify-center bg-slate-100">
            <img
              src={activeContentLink.replace('#img', '')}
              alt={activeTab || 'Lesson'}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm pointer-events-none"
            />
          </div>
        ) : (
          <iframe
            src={activeContentLink.replace('#other', '')}
            className="w-full h-full border-0 flex-1 bg-white"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={activeTab || 'Lesson'}
          />
        )
      ) : (
        <iframe
          src={activeContentLink}
          className="w-full h-full border-0 flex-1 bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title={activeTab || 'Lesson'}
        />
      )}

      {isAnnotateMode && annotateCanvas}
    </div>
  ) : null;

  const boardShell = (
    <div
      ref={rootRef}
      className={
        isFullscreen
          ? `fixed inset-0 z-[180] flex flex-col ${
              isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
            }`
          : `${APP_STAGE_SHELL} flex flex-col`
      }
    >
      <div
        className={`flex flex-1 min-h-0 flex-col overflow-hidden min-w-0 ${
          isFullscreen ? SHELL_MAIN_PADDING : ''
        }`}
      >
        {isWhiteboard ? (
          <div
            className={`relative w-full flex-1 min-h-0 overflow-hidden shadow-inner rounded-2xl sm:rounded-3xl border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700'
                : 'bg-white border-slate-300'
            }`}
            style={getWhiteboardBgStyle()}
          >
            {annotateCanvas}
          </div>
        ) : isLessonView ? (
          lessonViewer
        ) : isSavedWhiteboards ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            {savedBoards.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center text-center px-6 py-16 ${APP_EMPTY_SLOT} ${theme.colorOutlineVariant} ${theme.colorOnSurfaceVariant}`}
              >
                <Save size={40} className="mb-4 opacity-50" />
                <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  No saved whiteboards yet
                </h3>
                <p className={`${TYPE.bodyMd} mt-1 max-w-sm`}>
                  Open annotate tools on the Whiteboard and use Save to keep a board
                  here, or download a page to your computer.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedBoards.map((board) => (
                  <div
                    key={board.id}
                    className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 flex flex-col gap-3`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                        } ${theme.text}`}
                      >
                        <Save size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
                          {board.name}
                        </p>
                        <p className={`${TYPE.labelMicro} mt-1 ${theme.colorOnSurfaceVariant}`}>
                          {board.totalPages} page{board.totalPages === 1 ? '' : 's'}
                          {board.updatedAt
                            ? ` · ${new Date(board.updatedAt).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => openSavedWhiteboard(board)}
                        className={`edu-control flex-1 px-3 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedWhiteboard(board.id)}
                        className={`edu-control px-3 py-2 rounded-xl ${TYPE.labelLg} ${chromeMuted} hover:text-rose-500 hover:bg-rose-500/20`}
                        title="Delete saved whiteboard"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 opacity-80">
            <div
              className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}
            >
              <Presentation
                size={28}
                className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}
              />
            </div>
            <h3
              className={`${TYPE.titleMd} ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Select a lesson or Whiteboard
            </h3>
            <p
              className={`${TYPE.bodyMd} mt-1 max-w-sm ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Open Lessons for
              {selectedClass?.name ? ` ${selectedClass.name}` : ' a class'}, or go
              to Whiteboard to draw.
            </p>
          </div>
        )}
      </div>

      {isFullscreen && annotateFooterBar}

      {isFullscreen && annotateFab}

      {!isFullscreen && annotateFab && shellOverlaySlot
        ? createPortal(annotateFab, shellOverlaySlot)
        : null}

      {!isFullscreen && showAnnotateFooter && mainFooterSlot && annotateFooterBar
        ? createPortal(annotateFooterBar, mainFooterSlot)
        : null}

      <SaveWhiteboardModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        pageLabel={isWhiteboard ? String(whiteboardPage) : '1'}
        defaultName={
          selectedClass?.name
            ? `${selectedClass.name} whiteboard`
            : 'Untitled whiteboard'
        }
        showLibraryOption={isWhiteboard}
        onDownloadPage={downloadCurrentPage}
        onSaveToLibrary={saveWhiteboardToLibrary}
      />
    </div>
  );

  // Portal out of the shell stacking context so the header/sidebar stay covered.
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(boardShell, document.body);
  }
  return boardShell;
}
