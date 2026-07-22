import { useEffect, useRef, useState } from 'react';
import { Globe, Loader2, Plus } from 'lucide-react';
import {
  DEFAULT_WORLD_CLOCKS,
  GOOGLE_MAPS_API_KEY,
  WORLD_CITIES,
} from '../constants';
import { WorldClockCard } from '../components/WorldClockCard';
import { Modal } from '../../../shared/Modal';
import { APP_EMPTY_SLOT, appFabClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

export function WorldClockView({ isDarkMode, theme, isLeft }) {
  const [worldClocks, setWorldClocks] = useState(DEFAULT_WORLD_CLOCKS);
  const [citySearch, setCitySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!citySearch.trim()) {
      setSearchResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);

      if (!GOOGLE_MAPS_API_KEY) {
        const fallback = WORLD_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(citySearch.toLowerCase()) &&
            !worldClocks.find((wc) => wc.name === c.name),
        ).map((c) => ({
          name: c.name,
          country: c.country,
          tz: c.tz,
          isFallback: true,
        }));
        setSearchResults(fallback);
        setIsSearching(false);
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(citySearch)}&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status === 'OK') {
          setSearchResults(
            data.results.map((r) => {
              const country = r.address_components.find((c) =>
                c.types.includes('country'),
              );
              return {
                name: r.formatted_address,
                lat: r.geometry.location.lat,
                lng: r.geometry.location.lng,
                country: country ? country.short_name : 'Global',
                isFallback: false,
              };
            }),
          );
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [citySearch, worldClocks]);

  const addCityClock = async (cityObj) => {
    if (cityObj.isFallback && cityObj.tz) {
      setWorldClocks((prev) => [...prev, { name: cityObj.name, tz: cityObj.tz }]);
      setCitySearch('');
      setShowDropdown(false);
      setIsAddModalOpen(false);
      return;
    }

    setIsAddingCity(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${cityObj.lat},${cityObj.lng}&timestamp=${timestamp}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.status === 'OK') {
        const shortName = cityObj.name.split(',')[0];
        setWorldClocks((prev) => [...prev, { name: shortName, tz: data.timeZoneId }]);
        setIsAddModalOpen(false);
      }
    } catch {
      // ignore
    }
    setIsAddingCity(false);
    setCitySearch('');
    setShowDropdown(false);
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border ${TYPE.bodyMd} outline-none transition-all ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  return (
    <div className="relative flex-1 min-h-0">
      {worldClocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 pb-24">
          {worldClocks.map((city, index) => (
            <WorldClockCard
              key={`${city.name}-${index}`}
              city={city.name}
              tz={city.tz}
              isDarkMode={isDarkMode}
              theme={theme}
              onClose={() =>
                setWorldClocks((prev) => prev.filter((_, i) => i !== index))
              }
            />
          ))}
        </div>
      ) : (
        <div
          className={`text-center py-16 mt-8 ${APP_EMPTY_SLOT} ${theme.colorOutlineVariant} ${theme.colorOnSurfaceVariant}`}
        >
          <Globe size={48} className="mx-auto mb-4 opacity-50" />
          <p className={TYPE.titleSm}>No world clocks active.</p>
          <p className={`${TYPE.bodyMd} mt-1`}>Tap + to add a city to your board.</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className={`${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        title="Add city"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCitySearch('');
          setShowDropdown(false);
        }}
        title="Add World Clock"
        theme={theme}
        isDarkMode={isDarkMode}
        maxWidth="max-w-md"
        headerStart={
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Globe size={18} />
          </div>
        }
        footer={
          isAddingCity ? (
            <span className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              Fetching timezone…
            </span>
          ) : null
        }
      >
        <div className="px-6 py-5" ref={searchRef}>
          <label
            className={`block ${TYPE.labelMicro} mb-2 ${theme.colorOnSurfaceVariant}`}
          >
            Search city
          </label>
          <input
            type="text"
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="e.g. Paris, Tokyo…"
            className={inputClass}
          />
          {showDropdown && (citySearch.trim() || isSearching) ? (
            <ul
              className={`mt-2 max-h-48 overflow-y-auto rounded-xl border shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
            >
              {isSearching ? (
                <li className={`px-4 py-3 flex items-center gap-2 ${theme.colorOnSurfaceVariant}`}>
                  <Loader2 size={16} className="animate-spin" /> Searching…
                </li>
              ) : searchResults.length === 0 ? (
                <li className={`px-4 py-3 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                  No cities found
                </li>
              ) : (
                searchResults.map((result, i) => (
                  <li key={`${result.name}-${i}`}>
                    <button
                      type="button"
                      onClick={() => addCityClock(result)}
                      className={`w-full text-left px-4 py-3 ${TYPE.bodyMd} transition-colors hover:opacity-90 ${theme.colorOnSurface} ${theme.colorPrimaryContainer}`}
                    >
                      {result.name}
                      {result.country ? (
                        <span className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                          {result.country}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
          {!GOOGLE_MAPS_API_KEY ? (
            <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Using built-in city list. Set{' '}
              <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> for global search.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
