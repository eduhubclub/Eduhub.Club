/**
 * Skip link — first focusable control in the shell.
 * Visually hidden until focused; jumps to #main-content.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="edu-skip-link">
      Skip to main content
    </a>
  );
}
