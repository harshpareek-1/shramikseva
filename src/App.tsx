import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Profession,
  RankedWorker,
  SearchFilters,
  SearchQueryAnalysis,
  Booking,
  AdminMarketplaceConfig,
  WorkerProfile,
  AvailabilityStatus,
} from './types.ts';
import { Header } from './components/Header.tsx';
import { LowLiteracyHero } from './components/LowLiteracyHero.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { ActiveFiltersBanner } from './components/ActiveFiltersBanner.tsx';
import { WorkerCard } from './components/WorkerCard.tsx';
import { FilterDrawer } from './components/FilterDrawer.tsx';
import { WorkerDetailModal } from './components/WorkerDetailModal.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { CustomerBookingsModal } from './components/CustomerBookingsModal.tsx';
import { WorkerDashboard } from './components/WorkerDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LocationModal } from './components/LocationModal.tsx';
import {
  SlidersHorizontal,
  Loader2,
  Users,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  // Navigation & User State
  const [activeView, setActiveView] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [workersList, setWorkersList] = useState<WorkerProfile[]>([]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [nlpAnalysis, setNlpAnalysis] = useState<SearchQueryAnalysis | undefined>(undefined);
  const [rankedWorkers, setRankedWorkers] = useState<RankedWorker[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Bookings & Admin Config
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminConfig, setAdminConfig] = useState<AdminMarketplaceConfig | null>(null);

  // Modals & Drawers
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState<RankedWorker | null>(null);
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<RankedWorker | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Google Maps Platform Quota Exceeded state
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  // Load initial demo users, config, and workers
  useEffect(() => {
    // 1. Fetch Demo Users
    fetch('/api/auth/demo-users')
      .then(res => res.json())
      .then(data => {
        if (data.users && data.users.length > 0) {
          setDemoUsers(data.users);
          // Default to first customer
          setCurrentUser(data.users[0]);
        }
      })
      .catch(err => console.error('Error fetching demo users:', err));

    // 2. Fetch Admin Configuration
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setAdminConfig(data.config);
        }
      })
      .catch(err => console.error('Error fetching admin config:', err));

    // 3. Fetch Bookings
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        if (data.bookings) {
          setBookings(data.bookings);
        }
      })
      .catch(err => console.error('Error fetching bookings:', err));

    // 4. Fetch All Workers for profile matching
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => {
        if (data.workers) {
          setWorkersList(data.workers);
        }
      })
      .catch(err => console.error('Error fetching workers:', err));
  }, []);

  // Voice recognition toggle for search
  const handleToggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please type in the search bar.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setSearchQuery(transcript);
        executeSearch(transcript, activeFilters);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Primary search execution
  const executeSearch = useCallback(
    async (queryText: string, filtersToApply: SearchFilters, customLoc?: { name: string; lat: number; lng: number }) => {
      setIsLoading(true);
      try {
        const coords = customLoc || currentUser?.location || { name: 'Vaishali Nagar, Jaipur', lat: 26.9124, lng: 75.7433 };
        const params = new URLSearchParams();
        if (queryText.trim()) params.append('q', queryText.trim());
        if (coords?.lat && coords?.lng) {
          params.append('lat', String(coords.lat));
          params.append('lng', String(coords.lng));
          params.append('locationName', coords.name || 'Jaipur');
        }
        if (filtersToApply.profession) params.append('profession', filtersToApply.profession);
        if (filtersToApply.availability && filtersToApply.availability !== 'all') {
          params.append('availability', filtersToApply.availability);
        }
        if (filtersToApply.maxDistanceKm) {
          params.append('maxDistance', String(filtersToApply.maxDistanceKm));
        }
        if (filtersToApply.minRating) {
          params.append('minRating', String(filtersToApply.minRating));
        }
        if (filtersToApply.minExperienceYears) {
          params.append('minExperience', String(filtersToApply.minExperienceYears));
        }
        if (filtersToApply.priceTier && filtersToApply.priceTier !== 'all') {
          params.append('priceTier', filtersToApply.priceTier);
        }
        if (filtersToApply.emergencyOnly) {
          params.append('emergencyOnly', 'true');
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Search failed with status ${res.status}:`, errText);
          return;
        }
        const data = await res.json();

        const workers = data.results || data.rankedWorkers;
        if (workers) {
          setRankedWorkers(workers);
          setTotalCandidates(data.totalCandidates || 0);
          setMatchedCount(data.matchedCount || 0);
          const analysis = data.analysis || data.nlpAnalysis;
          setNlpAnalysis(analysis);

          // Update activeFilters with the applied auto-filters unless manually removed
          if (analysis?.autoFiltersApplied) {
            setActiveFilters(prev => ({
              ...analysis.autoFiltersApplied,
              ...prev, // Keep explicit manual overrides
            }));
          }
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser?.location]
  );

  // Handle location update from LocationModal
  const handleSaveLocation = async (newLoc: { name: string; lat: number; lng: number }) => {
    if (currentUser) {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/location`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoc),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            if (data.user.workerProfile) {
              setWorkersList(prev =>
                prev.map(w => (w.id === data.user.workerProfile.id ? data.user.workerProfile : w))
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to update location on server:', err);
      }
    } else {
      setCurrentUser(prev => prev ? { ...prev, location: newLoc } : null);
    }
    // Re-run search with the updated location to refresh distances & ranking
    executeSearch(searchQuery, activeFilters, newLoc);
  };

  // Initial search load
  useEffect(() => {
    executeSearch(searchQuery, activeFilters);
  }, []);

  // Filter handlers
  const handleRemoveFilter = (key: keyof SearchFilters) => {
    const updated = { ...activeFilters };
    delete updated[key];
    setActiveFilters(updated);
    executeSearch(searchQuery, updated);
  };

  const handleResetAllFilters = () => {
    setActiveFilters({});
    executeSearch(searchQuery, {});
  };

  const handleUpdateFiltersFromDrawer = (updates: Partial<SearchFilters>) => {
    const updated = { ...activeFilters, ...updates };
    // remove undefined values
    Object.keys(updated).forEach(k => {
      const key = k as keyof SearchFilters;
      if (updated[key] === undefined) delete updated[key];
    });
    setActiveFilters(updated);
    executeSearch(searchQuery, updated);
  };

  const handleSelectCategory = (prof: Profession | 'All') => {
    const newProf = prof === 'All' ? undefined : prof;
    const updated = { ...activeFilters, profession: newProf };
    if (!newProf) delete updated.profession;
    setActiveFilters(updated);
    executeSearch(searchQuery, updated);
  };

  const handleSelectQuickPrompt = (promptText: string) => {
    setSearchQuery(promptText);
    executeSearch(promptText, {});
  };

  // Booking handlers
  const handleBookingSuccess = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
    // Also re-fetch to keep synced
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        if (data.bookings) setBookings(data.bookings);
      });
  };

  const handleRateBooking = async (bookingId: string, rating: number, review: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review, status: 'completed' }),
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? data.booking : b)));
        // Refresh search ranking to reflect new rating immediately
        executeSearch(searchQuery, activeFilters);
      }
    } catch (err) {
      console.error('Rating submission failed', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? data.booking : b)));
      }
    } catch (err) {
      console.error('Cancel failed', err);
    }
  };

  // Worker view handlers
  const handleWorkerStatusUpdate = async (bookingId: string, status: Booking['status']) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? data.booking : b)));
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const handleWorkerAvailabilityUpdate = async (workerId: string, availability: AvailabilityStatus) => {
    try {
      const res = await fetch(`/api/workers/${workerId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      });
      const data = await res.json();
      if (data.worker) {
        setWorkersList(prev => prev.map(w => (w.id === data.worker.id ? data.worker : w)));
        if (currentUser?.workerProfile?.id === data.worker.id) {
          setCurrentUser(prev => (prev ? { ...prev, workerProfile: data.worker } : prev));
        }
        // Refresh rankings
        executeSearch(searchQuery, activeFilters);
      }
    } catch (err) {
      console.error('Availability update failed', err);
    }
  };

  const handleWorkerSkillsUpdate = async (workerId: string, skills: string[]) => {
    try {
      const res = await fetch(`/api/workers/${workerId}/skills`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      const data = await res.json();
      if (data.worker) {
        setWorkersList(prev => prev.map(w => (w.id === data.worker.id ? data.worker : w)));
        if (currentUser?.workerProfile?.id === data.worker.id) {
          setCurrentUser(prev => (prev ? { ...prev, workerProfile: data.worker } : prev));
        }
        executeSearch(searchQuery, activeFilters);
      }
    } catch (err) {
      console.error('Skills update failed', err);
    }
  };

  // Admin config save
  const handleSaveAdminConfig = async (newConfig: AdminMarketplaceConfig) => {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    const data = await res.json();
    if (data.config) {
      setAdminConfig(data.config);
      // Re-run search so the new weights take effect instantly
      executeSearch(searchQuery, activeFilters);
    }
  };

  const handleResetAdminDefaults = async () => {
    const res = await fetch('/api/admin/reset', { method: 'POST' });
    const data = await res.json();
    if (data.config) {
      setAdminConfig(data.config);
      executeSearch(searchQuery, activeFilters);
    }
  };

  // Resolve current active worker for Worker Space
  const activeWorkerProfile = useMemo(() => {
    if (currentUser?.role === 'worker') {
      // 1. Direct attachment on currentUser
      if (currentUser.workerProfile) {
        return currentUser.workerProfile;
      }
      // 2. Lookup in workersList by userId or exact name
      const matchedFromList = workersList.find(
        w => w.userId === currentUser.id || w.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (matchedFromList) return matchedFromList;

      // 3. Lookup in rankedWorkers by userId or name
      const matchedFromRanked = rankedWorkers.find(
        rw => rw.worker.userId === currentUser.id || rw.worker.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (matchedFromRanked) return matchedFromRanked.worker;
    }

    // If viewing Worker Space while logged in as customer or admin, show first worker
    return workersList[0] || rankedWorkers[0]?.worker || null;
  }, [currentUser, workersList, rankedWorkers]);

  const activeBookingsCount = bookings.filter(
    b => b.status === 'pending' || b.status === 'accepted' || b.status === 'en_route' || b.status === 'in_progress'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={user => {
          const workerProfile =
            user.workerProfile ||
            (user.role === 'worker'
              ? workersList.find(
                  w => w.userId === user.id || w.name.toLowerCase() === user.name.toLowerCase()
                )
              : undefined);
          setCurrentUser({ ...user, workerProfile });
          if (user.role === 'worker') setActiveView('worker');
          else if (user.role === 'admin') setActiveView('admin');
          else setActiveView('customer');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
        activeView={activeView}
        setActiveView={setActiveView}
        activeBookingsCount={activeBookingsCount}
        onOpenBookings={() => setIsBookingsModalOpen(true)}
        demoUsers={demoUsers}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* Google Maps Quota Exceeded Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-16 z-30 shadow-xs flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Content Areas */}
      <main className="flex-1">
        {/* VIEW 1: Customer Marketplace Search & Discovery */}
        {activeView === 'customer' && (
          <div>
            {/* Visual Category Cards & 1-Tap Actions */}
            <LowLiteracyHero
              selectedProfession={activeFilters.profession}
              onSelectProfession={handleSelectCategory}
              onSelectQuickPrompt={handleSelectQuickPrompt}
              isListening={isListening}
              onToggleVoiceSearch={handleToggleVoiceSearch}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              {/* Search Bar with live typeahead suggestions & voice mic */}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={text => executeSearch(text, activeFilters)}
                isListening={isListening}
                onToggleVoice={handleToggleVoiceSearch}
              />

              {/* Smart Automatic & Manual Filter Pill Bar */}
              <ActiveFiltersBanner
                nlpAnalysis={nlpAnalysis}
                activeFilters={activeFilters}
                onRemoveFilter={handleRemoveFilter}
                onResetAllFilters={handleResetAllFilters}
                onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                matchedCount={matchedCount}
                totalCandidates={totalCandidates}
              />

              {/* Loading indicator */}
              {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
                  <p className="text-xs font-semibold">Running Multi-Factor Ranking Engine...</p>
                </div>
              )}

              {/* Workers Grid */}
              {!isLoading && (
                <>
                  {rankedWorkers.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Users className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">No Workers Matched Current Filters</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Try expanding your distance limit or clearing active filters to see all available local professionals.
                        </p>
                      </div>
                      <button
                        onClick={handleResetAllFilters}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <span>Recommended Workers</span>
                          <span className="text-xs font-bold text-slate-500">
                            (Ranked dynamically for your job)
                          </span>
                        </h2>
                        <button
                          onClick={() => setIsFilterDrawerOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 sm:hidden"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Filter</span>
                        </button>
                      </div>

                      {/* Worker Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rankedWorkers.map(item => (
                          <WorkerCard
                            key={item.worker.id}
                            item={item}
                            onBook={w => setSelectedWorkerForBooking(w)}
                            onViewDetails={w => setSelectedWorkerForDetails(w)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Worker Dedicated Space */}
        {activeView === 'worker' && (
          <div>
            {activeWorkerProfile ? (
              <WorkerDashboard
                worker={activeWorkerProfile}
                bookings={bookings}
                onUpdateStatus={handleWorkerStatusUpdate}
                onUpdateAvailability={handleWorkerAvailabilityUpdate}
                onUpdateSkills={handleWorkerSkillsUpdate}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-slate-200">
                <p className="font-bold text-slate-800">No worker profile selected.</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Please log in as a registered worker or switch to a demo worker account.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl"
                >
                  Log In as Worker
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Admin Marketplace Ranking Engine Controls */}
        {activeView === 'admin' && adminConfig && (
          <AdminPanel
            config={adminConfig}
            onSaveConfig={handleSaveAdminConfig}
            onResetDefaults={handleResetAdminDefaults}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">Karyo</span>
            <span>—</span>
            <span>Intelligent On-Demand Home Services Marketplace</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <button onClick={() => setActiveView('customer')} className="hover:text-amber-600">
              Customer Search
            </button>
            <button onClick={() => setActiveView('worker')} className="hover:text-amber-600">
              Worker Dashboard
            </button>
            <button onClick={() => setActiveView('admin')} className="hover:text-amber-600">
              Admin Controls
            </button>
          </div>
        </div>
      </footer>

      {/* Filter Adjust Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={activeFilters}
        onUpdateFilters={handleUpdateFiltersFromDrawer}
        onResetFilters={handleResetAllFilters}
        matchedCount={matchedCount}
      />

      {/* Worker Detail & Transparent Score Breakdown Modal */}
      <WorkerDetailModal
        item={selectedWorkerForDetails}
        onClose={() => setSelectedWorkerForDetails(null)}
        onBook={item => {
          setSelectedWorkerForDetails(null);
          setSelectedWorkerForBooking(item);
        }}
      />

      {/* Booking Modal */}
      <BookingModal
        item={selectedWorkerForBooking}
        currentUser={currentUser}
        onClose={() => setSelectedWorkerForBooking(null)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Customer Service Bookings Drawer */}
      <CustomerBookingsModal
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
        bookings={currentUser ? bookings.filter(b => b.customerId === currentUser.id) : bookings}
        onRateBooking={handleRateBooking}
        onCancelBooking={handleCancelBooking}
      />

      {/* Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={user => {
          const workerProfile =
            user.workerProfile ||
            (user.role === 'worker'
              ? workersList.find(
                  w => w.userId === user.id || w.name.toLowerCase() === user.name.toLowerCase()
                )
              : undefined);
          setCurrentUser({ ...user, workerProfile });
          if (user.role === 'worker') setActiveView('worker');
          else if (user.role === 'admin') setActiveView('admin');
          else setActiveView('customer');
        }}
        demoUsers={demoUsers}
      />

      {/* Location Picker & Auto-Detector (Google Maps Platform) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentUser?.location || { name: 'Vaishali Nagar, Jaipur', lat: 26.9124, lng: 75.7433 }}
        onSaveLocation={handleSaveLocation}
        isWorker={activeView === 'worker' || currentUser?.role === 'worker'}
      />
    </div>
  );
}
