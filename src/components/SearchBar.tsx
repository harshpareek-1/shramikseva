import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Mic, Sparkles, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  isListening: boolean;
  onToggleVoice: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  isListening,
  onToggleVoice,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live suggestions from backend API
  useEffect(() => {
    let active = true;
    if (value.trim().length > 0) {
      fetch(`/api/suggestions?q=${encodeURIComponent(value.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (active && data.suggestions) {
            setSuggestions(data.suggestions);
          }
        })
        .catch(() => {});
    } else {
      setSuggestions([
        'AC repair near me',
        'Emergency plumber available now',
        'Electrician for switchboard repair',
        'Carpenter for furniture assembly',
        'Deep home cleaning today',
      ]);
    }
    return () => {
      active = false;
    };
  }, [value]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (text: string) => {
    onChange(text);
    onSearch(text);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto my-4">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5 text-amber-600" />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder='Try "Emergency plumber near me" or "AC repair electrician"...'
          className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-slate-200 focus:border-amber-500 rounded-2xl text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-hidden text-sm sm:text-base transition-all font-medium"
        />

        {/* Action icons right side */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {value && (
            <button
              onClick={() => {
                onChange('');
                onSearch('');
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
            }`}
            title="Search with voice"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Search Submit button */}
          <button
            type="button"
            onClick={() => {
              onSearch(value);
              setShowSuggestions(false);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Find
          </button>
        </div>
      </div>

      {/* Live Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
          <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{value ? 'Suggestions' : 'Popular Searches'}</span>
            <span className="text-[10px] lowercase text-slate-400">click to search</span>
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(s)}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                <span className="font-medium">{s}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
