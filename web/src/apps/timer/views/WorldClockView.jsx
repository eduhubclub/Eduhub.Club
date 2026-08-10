import { useEffect, useRef, useState } from 'react';
import { Globe, LayoutGrid, Loader2, Map, Plus } from 'lucide-react';
import {
  DEFAULT_WORLD_CLOCKS,
  GOOGLE_MAPS_API_KEY,
  searchWorldLocations,
  withCityCoords,
} from '../constants';
import { WorldClockCard } from '../components/WorldClockCard';
import { WorldClockMap } from '../components/WorldClockMap';
import { Modal } from '../../../shared/Modal';
import { SegmentControl } from '../../../shared/SegmentControl';
import { APP_EMPTY_SLOT, appFabClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

export function WorldClockView({ isDarkMode, theme, isLeft }) {
  const [worldClocks, setWorldClocks] = useState(DEFAULT_WORLD_CLOCKS);
  const [boardMode, setBoardMode] = useState('cards');
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
      const excludeNames = worldClocks.map((wc) => wc.name);
      const localResults = searchWorldLocations(citySearch, { excludeNames });

      if (!GOOGLE_MAPS_API_KEY) {
        setSearchResults(localResults);
        setIsSearching(false);
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(citySearch)}&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results?.length) {
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
          setSearchResults(localResults);
        }
      } catch {
        setSearchResults(localResults);
      }
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [citySearch, worldClocks]);

  const addCityClock = async (cityObj) => {
    if (cityObj.isFallback && cityObj.tz) {
      const next = withCityCoords({
        name: cityObj.name,
        tz: cityObj.tz,
        lat: cityObj.lat,
        lng: cityObj.lng,
      });
      setWorldClocks((prev) => [...prev, next]);
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
        setWorldClocks((prev) => [
          ...prev,
          {
            name: shortName,
            tz: data.timeZoneId,
            lat: cityObj.lat,
            lng: cityObj.lng,
          },
        ]);
        setIsAddModalOpen(false);
      }
    } catch {
      // ignore
    }
    setIsAddingCity(false);
    setCitySearch('');
    setShowDropdown(false);
  };

  const removeClock = (index) => {
    setWorldClocks((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border ${TYPE.bodyMd} outline-none transition-all ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  return (
    <div className="relative">
      <div className="flex justify-center mt-2 mb-4">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={boardMode}
          onChange={setBoardMode}
          options={[
            { id: 'cards', label: 'Cards', icon: LayoutGrid },
            { id: 'map', label: 'Map', icon: Map },
          ]}
        />
      </div>

      {worldClocks.length === 0 ? (
        <div
          className={`text-center py-16 mt-4 ${APP_EMPTY_SLOT} ${theme.colorOutlineVariant} ${theme.colorOnSurfaceVariant}`}
        >
          <Globe size={48} className="mx-auto mb-4 opacity-50" />
          <p className={TYPE.titleSm}>No world clocks active.</p>
          <p className={`${TYPE.bodyMd} mt-1`}>Tap + to add a city to your board.</p>
        </div>
      ) : boardMode === 'map' ? (
        <div className="px-1 pb-8">
          <WorldClockMap
            clocks={worldClocks}
            isDarkMode={isDarkMode}
            theme={theme}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1 pt-2 pb-8">
          {worldClocks.map((city, index) => (
            <WorldClockCard
              key={`${city.name}-${index}`}
              city={city.name}
              tz={city.tz}
              isDarkMode={isDarkMode}
              theme={theme}
              onClose={() => removeClock(index)}
            />
          ))}
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
            placeholder="e.g. Shanghai, Lagos, grandparents’ city…"
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
                  <li key={`${result.name}-${result.tz || result.lat}-${i}`}>
                    <button
                      type="button"
                      onClick={() => addCityClock(result)}
                      className={`w-full text-left px-4 py-3 ${TYPE.bodyMd} transition-colors hover:opacity-90 ${theme.colorOnSurface}`}
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
          <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Search any city or region — cards and map pins share the same clocks.
          </p>
        </div>
      </Modal>
    </div>
  );
}
