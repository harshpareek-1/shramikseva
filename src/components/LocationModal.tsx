import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  Loader2,
  Crosshair,
  AlertCircle,
  Building2,
  Map as MapIcon,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  onSaveLocation: (loc: { name: string; lat: number; lng: number }) => Promise<void> | void;
  isWorker?: boolean;
}

// Popular predefined localities in Jaipur for rapid 1-tap selection
const POPULAR_LOCALITIES = [
  { name: 'Vaishali Nagar, Jaipur', lat: 26.9124, lng: 75.7433 },
  { name: 'Malviya Nagar, Jaipur', lat: 26.853, lng: 75.805 },
  { name: 'Mansarovar, Jaipur', lat: 26.8617, lng: 75.7629 },
  { name: 'C-Scheme, Jaipur', lat: 26.9075, lng: 75.795 },
  { name: 'Raja Park, Jaipur', lat: 26.897, lng: 75.827 },
  { name: 'Jagatpura, Jaipur', lat: 26.82, lng: 75.845 },
  { name: 'Vidhyadhar Nagar, Jaipur', lat: 26.96, lng: 75.78 },
  { name: 'Tonk Road, Jaipur', lat: 26.87, lng: 75.79 },
];

// Inner controller component to dynamically pan Google Map when coordinates change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
  isWorker = false,
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const [selectedLat, setSelectedLat] = useState(currentLocation?.lat || 26.9124);
  const [selectedLng, setSelectedLng] = useState(currentLocation?.lng || 75.7433);
  const [selectedName, setSelectedName] = useState(currentLocation?.name || 'Vaishali Nagar, Jaipur');

  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; name: string; mainText?: string; secondaryText?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLat(currentLocation?.lat || 26.9124);
      setSelectedLng(currentLocation?.lng || 75.7433);
      setSelectedName(currentLocation?.name || 'Vaishali Nagar, Jaipur');
      setStatusMessage(null);
      setSuggestions([]);
      setSearchInput('');
    }
  }, [isOpen, currentLocation]);

  // Handle Autocomplete search queries
  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(searchInput)}`);
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  // Handle Auto-detect using browser Geolocation + Google Maps reverse geocode
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setStatusMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser. Please search or pick a location below.',
      });
      return;
    }

    setIsLocating(true);
    setStatusMessage({
      type: 'info',
      text: 'Detecting GPS coordinates from your device...',
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLat(lat);
        setSelectedLng(lng);

        setStatusMessage({
          type: 'info',
          text: 'Resolving address with Google Maps...',
        });

        try {
          const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (res.status === 429) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          if (res.ok) {
            const data = await res.json();
            const resolvedName = data.name || data.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setSelectedName(resolvedName);
            setStatusMessage({
              type: 'success',
              text: `Detected: ${resolvedName}`,
            });
          } else {
            setSelectedName(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setStatusMessage({
              type: 'success',
              text: 'GPS coordinates locked.',
            });
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setSelectedName(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setStatusMessage({
            type: 'info',
            text: 'Coordinates detected successfully.',
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let errorMsg = 'Could not access device location.';
        if (err.code === 1) {
          errorMsg = 'Location access was denied. Please allow location permissions in your browser or search for your address manually.';
        } else if (err.code === 2) {
          errorMsg = 'Position unavailable. Please search for your neighborhood or pick from the popular areas below.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please try again or use the search bar.';
        }
        setStatusMessage({
          type: 'error',
          text: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Selecting a place prediction from autocomplete
  const handleSelectSuggestion = async (suggestion: { placeId: string; name: string }) => {
    setIsSearching(true);
    setSearchInput('');
    setSuggestions([]);

    try {
      if (suggestion.placeId) {
        const res = await fetch(`/api/maps/place-details?placeId=${encodeURIComponent(suggestion.placeId)}`);
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (res.ok) {
          const data = await res.json();
          setSelectedLat(data.lat);
          setSelectedLng(data.lng);
          setSelectedName(suggestion.name);
          setStatusMessage({
            type: 'success',
            text: `Selected: ${suggestion.name}`,
          });
          return;
        }
      }

      // Fallback: geocode by name
      const geoRes = await fetch(`/api/maps/geocode?address=${encodeURIComponent(suggestion.name)}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        setSelectedLat(geoData.lat);
        setSelectedLng(geoData.lng);
        setSelectedName(suggestion.name);
        setStatusMessage({
          type: 'success',
          text: `Selected: ${suggestion.name}`,
        });
      }
    } catch (err) {
      console.error('Failed to resolve place coordinates:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocode when clicking on the map
  const handleMapClick = async (e: any) => {
    if (e.detail && e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setSelectedLat(lat);
      setSelectedLng(lng);

      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (res.ok) {
          const data = await res.json();
          const name = data.name || data.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setSelectedName(name);
          setStatusMessage({
            type: 'success',
            text: `Pin moved to: ${name}`,
          });
        }
      } catch (err) {
        console.error('Error reverse geocoding clicked point:', err);
      }
    }
  };

  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setSelectedLat(preset.lat);
    setSelectedLng(preset.lng);
    setSelectedName(preset.name);
    setStatusMessage({
      type: 'success',
      text: `Selected: ${preset.name}`,
    });
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await onSaveLocation({
        name: selectedName,
        lat: selectedLat,
        lng: selectedLng,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save location:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to update location. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="location-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="location-modal-container"
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {isWorker ? 'Set Your Work Base Location' : 'Choose Your Service Location'}
              </h2>
              <p className="text-xs text-slate-500">
                {isWorker
                  ? 'Determines your travel radius and job matching priority'
                  : 'Workers are ranked by real-time travel distance from this address'}
              </p>
            </div>
          </div>
          <button
            id="close-location-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Auto-Detect & Search Row */}
          <div className="space-y-2">
            {/* Auto Detect Button */}
            <button
              id="auto-detect-location-btn"
              type="button"
              onClick={handleAutoDetect}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-sm transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Accessing device GPS & Google Maps...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Auto-Detect My Current Location (GPS)</span>
                </>
              )}
            </button>

            {/* Google Places Search Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="google-maps-location-search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Or search neighborhood, street, or landmark..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div
                  id="places-suggestions-dropdown"
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100"
                >
                  {suggestions.map((item) => (
                    <button
                      key={item.placeId || item.name}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/60 flex items-start gap-2.5 transition-colors group"
                    >
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-amber-900 truncate">
                          {item.mainText || item.name}
                        </p>
                        {item.secondaryText && (
                          <p className="text-[11px] text-slate-400 truncate">{item.secondaryText}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status feedback message */}
          {statusMessage && (
            <div
              className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Interactive Google Map Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <MapIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Interactive Map & Pinpoint</span>
              </span>
              <span className="text-slate-400 text-[11px]">
                Click map to reposition pin
              </span>
            </div>

            <div
              id="google-maps-location-preview-box"
              className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
            >
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={{ lat: selectedLat, lng: selectedLng }}
                  center={{ lat: selectedLat, lng: selectedLng }}
                  defaultZoom={13}
                  zoom={14}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  onClick={handleMapClick}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapRecenter lat={selectedLat} lng={selectedLng} />
                  <AdvancedMarker
                    position={{ lat: selectedLat, lng: selectedLng }}
                    title={selectedName}
                  />
                </Map>
              </APIProvider>
            </div>
          </div>

          {/* Popular Area Presets */}
          <div>
            <span className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Popular Localities (Jaipur)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_LOCALITIES.map((loc) => {
                const isCurrent = selectedName.toLowerCase().includes(loc.name.split(',')[0].toLowerCase());
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectPreset(loc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {loc.name.split(',')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Selection summary */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Location
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedName}
                </p>
                <p className="text-[10px] text-slate-500">
                  Lat: {selectedLat.toFixed(4)}, Lng: {selectedLng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="apply-location-btn"
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
