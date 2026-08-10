import './ArcadeCabinet.css';
import '../solitaire/Solitaire.css';

/**
 * Shared pixel arcade cabinet — Classic select + Classic play chrome.
 */
export function ArcadeCabinet({
  title,
  subtitle,
  headerRight,
  children,
  deck,
  className = '',
}) {
  return (
    <div className={`arcade-pixel arcade-cab-room ${className}`.trim()}>
      <div className="arcade-cab">
        <header className="arcade-cab-marquee">
          {headerRight ? (
            <div className="arcade-cab-marquee-row">
              <h1 className="arcade-cab-marquee-title">{title}</h1>
              {headerRight}
            </div>
          ) : (
            <h1 className="arcade-cab-marquee-title">{title}</h1>
          )}
          {subtitle ? (
            <p className="arcade-cab-marquee-sub">{subtitle}</p>
          ) : null}
        </header>

        <div className="arcade-cab-body">
          <div className="arcade-cab-bezel">
            <div className="arcade-cab-crt">
              <div className="arcade-cab-crt-inner">{children}</div>
            </div>
          </div>

          {deck != null ? (
            <div className="arcade-cab-deck">
              <div className="arcade-cab-deck-art" aria-hidden="true">
                <span className="arcade-cab-stick" />
                <span className="arcade-cab-deck-dots">
                  <span className="arcade-cab-dot arcade-cab-dot-pink" />
                  <span className="arcade-cab-dot" />
                  <span className="arcade-cab-dot arcade-cab-dot-pink" />
                  <span className="arcade-cab-dot" />
                </span>
                <span className="arcade-cab-stick" />
              </div>
              <div className="arcade-cab-deck-controls">{deck}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
