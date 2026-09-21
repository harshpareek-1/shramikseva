import React, { useState, useEffect, useRef } from 'react';
import { RankedWorker, User, Booking } from '../types.ts';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Search,
  Crosshair,
  Loader2,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface BookingModalProps {
  item: RankedWorker | null;
  currentUser: User | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

// Controller to smoothly pan the embedded map when coordinates update
function MiniMapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lng) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  item,
  currentUser,
  onClose,
  onBookingSuccess,
}) => {
  if (!item) return null;

  const { worker, estimatedDistanceKm, estimatedTravelTimeMins } = item;
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const [serviceTitle, setServiceTitle] = useState(
    worker.skills[0] ? `${worker.skills[0]} Service` : `${worker.profession} Service`
  );
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('Immediate (Next 30 mins)');
  const [address, setAddress] = useState(currentUser?.location.name || 'Vaishali Nagar, Jaipur');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser?.location?.lat || 26.9124,
    lng: currentUser?.location?.lng || 75.7433,
  });
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98290 12345');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Flexible Timing Slot States
  const [timingTab, setTimingTab] = useState<'quick' | 'flexible'>('quick');
  const [flexDayOffset, setFlexDayOffset] = useState<number>(0); // 0: today, 1: tomorrow, 2: day after
  const [flexWindow, setFlexWindow] = useState<string>('afternoon'); // 'morning', 'midday', 'afternoon', 'evening', 'custom'
  const [customStartTime, setCustomStartTime] = useState<string>('10:00');
  const [customEndTime, setCustomEndTime] = useState<string>('13:00');
  const [flexMargin, setFlexMargin] = useState<string>('30'); // '30', '60', 'exact', 'anytime'

  const formatTime12 = (t: string) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getDayName = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const WINDOW_SLOTS = [
    { id: 'morning', label: 'Morning Slot', range: '08:00 AM - 11:00 AM', desc: '08:00 - 11:00 AM' },
    { id: 'midday', label: 'Midday Slot', range: '11:00 AM - 02:00 PM', desc: '11:00 AM - 02:00 PM' },
    { id: 'afternoon', label: 'Afternoon Slot', range: '02:00 PM - 05:00 PM', desc: '02:00 - 05:00 PM' },
    { id: 'evening', label: 'Evening Slot', range: '05:00 PM - 08:00 PM', desc: '05:00 - 08:00 PM' },
  ];

  const MARGIN_OPTIONS = [
    { id: '30', label: '±30 mins', desc: 'Recommended' },
    { id: '60', label: '±1 hour', desc: 'Fastest match' },
    { id: 'anytime', label: 'Anytime', desc: 'Full window' },
    { id: 'exact', label: 'Strict time', desc: 'No buffer' },
  ];

  // Auto-sync scheduledTime when in flexible mode
  useEffect(() => {
    if (timingTab === 'flexible') {
      const day = getDayName(flexDayOffset);
      let timeText = '';
      if (flexWindow === 'custom') {
        timeText = `${formatTime12(customStartTime)} - ${formatTime12(customEndTime)}`;
      } else {
        const found = WINDOW_SLOTS.find(w => w.id === flexWindow);
        timeText = found ? found.range : '02:00 PM - 05:00 PM';
      }
      const marginText =
        flexMargin === '30'
          ? '(±30m Flexible)'
          : flexMargin === '60'
          ? '(±1h Flexible)'
          : flexMargin === 'anytime'
          ? '(Anytime in Window)'
          : '(Exact Slot)';
      setScheduledTime(`${day} · ${timeText} ${marginText}`);
    }
  }, [timingTab, flexDayOffset, flexWindow, customStartTime, customEndTime, flexMargin]);

  // Google Maps Search & Inline GPS Map states
  const [showMap, setShowMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; name: string; mainText?: string; secondaryText?: string }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Autocomplete Address Search
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`);
          if (res.status === 429) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setIsDropdownOpen((data.suggestions || []).length > 0);
          } else {
            setSuggestions([]);
            setIsDropdownOpen(false);
          }
        } catch (err) {
          console.error('Autocomplete error:', err);
        } finally {
          setIsSearching(false);
        }
      }, 280);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
    }
  };

  // Selecting a place prediction from Google Maps
  const handleSelectSuggestion = async (s: { placeId: string; name: string }) => {
    setAddress(s.name);
    setIsDropdownOpen(false);
    setSuggestions([]);

    try {
      if (s.placeId) {
        const res = await fetch(`/api/maps/place-details?placeId=${encodeURIComponent(s.placeId)}`);
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (res.ok) {
          const data = await res.json();
          setCoords({ lat: data.lat, lng: data.lng });
          setLocationStatus(`Pinned: ${s.name}`);
          setShowMap(true);
          return;
        }
      }

      // Fallback: geocode by address string
      const geoRes = await fetch(`/api/maps/geocode?address=${encodeURIComponent(s.name)}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        setCoords({ lat: geoData.lat, lng: geoData.lng });
        setLocationStatus(`Pinned: ${s.name}`);
        setShowMap(true);
      }
    } catch (err) {
      console.error('Error resolving coordinates:', err);
    }
  };

  // Auto-Detect GPS & Open Map right here
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setShowMap(true);
    setLocationStatus('Accessing device GPS & locating address...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (res.status === 429) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          if (res.ok) {
            const data = await res.json();
            const resolvedName = data.name || data.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(resolvedName);
            setLocationStatus(`Auto-Located: ${resolvedName}`);
          } else {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setLocationStatus('GPS coordinates locked.');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setLocationStatus('GPS coordinates locked.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('GPS access denied. You can search or click on the map to pin.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Map Click Listener to adjust pin & reverse-geocode
  const handleMapClick = async (e: any) => {
    if (e.detail && e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setCoords({ lat, lng });

      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (res.ok) {
          const data = await res.json();
          const resolvedName = data.name || data.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(resolvedName);
          setLocationStatus(`Pin moved to: ${resolvedName}`);
        }
      } catch (err) {
        console.error('Map click reverse geocode error:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser?.id || 'user_cust_guest',
          customerName: currentUser?.name || 'Customer Guest',
          customerPhone: phone,
          workerId: worker.id,
          workerName: worker.name,
          profession: worker.profession,
          serviceTitle,
          description: description || 'Standard home repair service requested.',
          scheduledTime,
          address,
          estimatedPrice: worker.hourlyRate,
        }),
      });

      const data = await res.json();
      if (data.booking) {
        setConfirmedBooking(data.booking);
        onBookingSuccess(data.booking);
      }
    } catch (err) {
      console.error('Booking failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <img
              src={worker.profilePhoto}
              alt={worker.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Book {worker.name}</h3>
              <p className="text-xs text-slate-500">
                {worker.profession} · 📍 {estimatedDistanceKm} km away (~{estimatedTravelTimeMins}m travel)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed view */}
        {confirmedBooking ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-slate-900">Job Request Sent!</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                {worker.name} has been notified and usually responds within{' '}
                <strong>{worker.statistics.avgResponseMinutes} minutes</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timing:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.scheduledTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Rate:</span>
                <span className="font-bold text-emerald-700">₹{confirmedBooking.estimatedPrice}/hr</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-colors"
            >
              Done / View My Jobs
            </button>
          </div>
        ) : (
          /* Form view */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
            {/* Service Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Service / Issue Needed
              </label>
              <select
                value={serviceTitle}
                onChange={e => setServiceTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:outline-hidden font-medium text-xs sm:text-sm"
              >
                {worker.skills.map((s, idx) => (
                  <option key={idx} value={`${s} Service`}>
                    {s}
                  </option>
                ))}
                <option value="General Inspection & Diagnostic">General Diagnostic / Inspection</option>
                <option value="Emergency Breakdown Repair">Emergency Urgent Repair</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brief Description of the Problem
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. AC cooling fan is making a loud rattling sound..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm"
              />
            </div>

            {/* Preferred Timing & Flexible Slots */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-extrabold text-slate-900">When do you need the worker?</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                  Flexible Slots
                </span>
              </label>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTimingTab('quick');
                    setScheduledTime('Immediate (Next 30 mins)');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    timingTab === 'quick'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Quick Presets
                </button>
                <button
                  type="button"
                  onClick={() => setTimingTab('flexible')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    timingTab === 'flexible'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Flexible Time Window</span>
                </button>
              </div>

              {/* Tab 1: Quick Presets */}
              {timingTab === 'quick' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Immediate', sub: 'Next 30 mins', full: 'Immediate (Next 30 mins)' },
                    { label: 'Today Afternoon', sub: '02:00 - 05:00 PM', full: 'Today Afternoon (02:00 - 05:00 PM)' },
                    { label: 'Today Evening', sub: '05:00 - 08:00 PM', full: 'Today Evening (05:00 - 08:00 PM)' },
                    { label: 'Tomorrow Morning', sub: '09:00 AM - 12:00 PM', full: 'Tomorrow Morning (09:00 AM - 12:00 PM)' },
                  ].map(time => {
                    const isSelected = scheduledTime.startsWith(time.label) || scheduledTime === time.full;
                    return (
                      <button
                        key={time.full}
                        type="button"
                        onClick={() => setScheduledTime(time.full)}
                        className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{time.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{time.sub}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Flexible Slot Builder */}
              {timingTab === 'flexible' && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-amber-50/40 border border-amber-200/70 pt-2.5 animate-in fade-in duration-150">
                  {/* Step 1: Select Day */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      1. Select Preferred Day
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0, 1, 2].map(offset => {
                        const name = getDayName(offset);
                        const isSelected = flexDayOffset === offset;
                        return (
                          <button
                            key={offset}
                            type="button"
                            onClick={() => setFlexDayOffset(offset)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Select Time Window Slot */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700">
                        2. Select Time Window
                      </span>
                      <button
                        type="button"
                        onClick={() => setFlexWindow(flexWindow === 'custom' ? 'afternoon' : 'custom')}
                        className="text-[10px] font-bold text-amber-700 hover:underline"
                      >
                        {flexWindow === 'custom' ? '← Use Standard Slots' : '+ Custom Time Range'}
                      </button>
                    </div>

                    {flexWindow !== 'custom' ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {WINDOW_SLOTS.map(slot => {
                          const isSelected = flexWindow === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setFlexWindow(slot.id)}
                              className={`py-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-100/80 border-amber-500 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <p className="text-xs font-bold text-slate-900">{slot.label}</p>
                              <p className="text-[10px] text-slate-500">{slot.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">From</label>
                          <input
                            type="time"
                            value={customStartTime}
                            onChange={e => setCustomStartTime(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-hidden"
                          />
                        </div>
                        <span className="text-slate-400 text-xs mt-3">to</span>
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">To</label>
                          <input
                            type="time"
                            value={customEndTime}
                            onChange={e => setCustomEndTime(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Flexibility Buffer Margin */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      3. Arrival Flexibility
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {MARGIN_OPTIONS.map(opt => {
                        const isSelected = flexMargin === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFlexMargin(opt.id)}
                            className={`py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <p className="text-[11px] font-bold leading-tight">{opt.label}</p>
                            <p className={`text-[9px] ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active flexible slot badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-200/80 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-medium truncate">
                      Slot: <strong className="text-amber-950 font-bold">{scheduledTime}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Address & Google Maps Location */}
            <div className="relative space-y-2">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <label className="text-xs font-bold text-slate-700">Service Location Address</label>
                <div className="flex items-center gap-1.5">
                  {currentUser?.location?.name && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddress(currentUser.location.name);
                        if (currentUser.location.lat && currentUser.location.lng) {
                          setCoords({ lat: currentUser.location.lat, lng: currentUser.location.lng });
                        }
                        setLocationStatus(`Using saved: ${currentUser.location.name}`);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-800 transition-colors px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                    >
                      Use Saved
                    </button>
                  )}

                  {/* Dedicated GPS Auto-Locate Button */}
                  <button
                    id="booking-gps-autolocate-btn"
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                    title="Auto-detect GPS coordinates and open map here"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3 h-3" />
                        <span>GPS Auto-Locate</span>
                      </>
                    )}
                  </button>

                  {/* Toggle Inline Map Button */}
                  <button
                    id="booking-toggle-map-btn"
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    title={showMap ? 'Hide map window' : 'Open map window here'}
                  >
                    <MapIcon className="w-3 h-3 text-slate-500" />
                    <span>{showMap ? 'Hide Map' : 'Map'}</span>
                  </button>
                </div>
              </div>

              {/* Searchable Google Maps Input */}
              <input
                id="booking-service-address-input"
                type="text"
                value={address}
                onChange={handleAddressChange}
                onFocus={() => {
                  if (suggestions.length > 0) setIsDropdownOpen(true);
                }}
                required
                placeholder="Search street, area, or landmark in Google Maps..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white bg-slate-50/60 focus:outline-hidden text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors shadow-2xs"
              />

              {/* Autocomplete Suggestions Dropdown */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div
                  id="booking-address-suggestions-dropdown"
                  className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto"
                >
                  {suggestions.map(item => (
                    <button
                      key={item.placeId || item.name}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50/80 flex items-start gap-2 transition-colors group cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-amber-950 truncate">
                          {item.mainText || item.name}
                        </p>
                        {item.secondaryText && (
                          <p className="text-[10px] text-slate-400 truncate">{item.secondaryText}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Status feedback & coordinates display */}
              {locationStatus && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium truncate">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{locationStatus}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </span>
                </div>
              )}

              {/* Inline Embedded Google Map Window (Compact, not too big or redirecting) */}
              {showMap && (
                <div
                  id="booking-inline-map-window"
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner mt-2 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapIcon className="w-3 h-3 text-amber-600" />
                      <span>Pinpoint Location (Click anywhere on map to reposition pin)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] font-bold"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="w-full h-[180px]">
                    <APIProvider apiKey={apiKey}>
                      <Map
                        defaultCenter={{ lat: coords.lat, lng: coords.lng }}
                        center={{ lat: coords.lat, lng: coords.lng }}
                        defaultZoom={14}
                        zoom={14}
                        mapId="DEMO_MAP_ID"
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        onClick={handleMapClick}
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <MiniMapController lat={coords.lat} lng={coords.lng} />
                        <AdvancedMarker
                          position={{ lat: coords.lat, lng: coords.lng }}
                          title={address}
                        />
                      </Map>
                    </APIProvider>
                  </div>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-hidden text-xs sm:text-sm"
              />
            </div>

            {/* Price Preview info */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-amber-950">Standard Base Fee:</span>
                <p className="text-[11px] text-amber-800">Pay worker directly after service completion</p>
              </div>
              <span className="text-base font-extrabold text-amber-900">₹{worker.hourlyRate}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? 'Confirming with worker...' : `Confirm & Dispatch ${worker.name}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
