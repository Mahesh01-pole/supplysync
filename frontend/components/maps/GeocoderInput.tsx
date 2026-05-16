'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  onSelect: (address: string, lat: number, lng: number) => void;
  /** Called on every keystroke so the parent can detect the user is editing the address */
  onQueryChange?: (q: string) => void;
  placeholder?: string;
  value?: string;
  dark?: boolean;
}

export default function GeocoderInput({
  onSelect,
  onQueryChange,
  placeholder = 'Search delivery location…',
  value = '',
  dark = false,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallRef = useRef<number>(0);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }

    // Nominatim rate limit: 1 req/s
    const now = Date.now();
    const sinceLastCall = now - lastCallRef.current;
    if (sinceLastCall < 1000) {
      await new Promise(r => setTimeout(r, 1000 - sinceLastCall));
    }
    lastCallRef.current = Date.now();

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SupplySync/1.0' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const handleSelect = (item: NominatimResult) => {
    const label = item.display_name;
    setQuery(label);
    setOpen(false);
    onSelect(label, parseFloat(item.lat), parseFloat(item.lon));
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const inputClass = dark
    ? 'pl-10 pr-8 w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white placeholder-slate-400'
    : 'pl-10 pr-8 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white text-slate-900 placeholder-slate-400';

  const dropdownClass = dark
    ? 'absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto'
    : 'absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto';

  const itemClass = dark
    ? 'px-4 py-3 cursor-pointer hover:bg-slate-700 border-b border-slate-700 last:border-0 transition'
    : 'px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 transition';

  return (
    <div className="relative">
      <div className="relative">
        <MapPin
          className={`absolute left-3 top-2.5 z-10 ${dark ? 'text-slate-400' : 'text-slate-400'}`}
          size={18}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChange?.(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={inputClass}
        />
        {loading && (
          <Loader2
            className={`absolute right-3 top-2.5 animate-spin ${dark ? 'text-slate-400' : 'text-slate-400'}`}
            size={18}
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onMouseDown={handleClear}
            className={`absolute right-3 top-2.5 ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className={dropdownClass}>
          {results.map((item) => (
            <li
              key={item.place_id}
              onMouseDown={() => handleSelect(item)}
              className={itemClass}
            >
              <div className="flex items-start gap-2">
                <MapPin
                  size={14}
                  className={`mt-0.5 flex-shrink-0 ${dark ? 'text-teal-400' : 'text-primary'}`}
                />
                <span className={`text-sm leading-snug ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {item.display_name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
