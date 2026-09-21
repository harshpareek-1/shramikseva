import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { parseNaturalLanguageQuery, generateSearchSuggestions } from './server/searchEngine.ts';
import { performHardFiltering, performManualFiltering } from './server/filterEngine.ts';
import { rankWorkers } from './server/rankingEngine.ts';
import { User, WorkerProfile, Booking, AdminMarketplaceConfig, SearchFilters } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // 1. Suggestions typeahead API
  app.get('/api/suggestions', (req, res) => {
    const q = (req.query.q as string) || '';
    const suggestions = generateSearchSuggestions(q);
    res.json({ suggestions });
  });

  // 2. Natural language query preview API
  app.post('/api/parse-query', (req, res) => {
    const { query, customerCoords } = req.body;
    const analysis = parseNaturalLanguageQuery(query, customerCoords);
    res.json(analysis);
  });

  // 3. Main Search & Recommendation API (Supports both GET and POST)
  const handleSearch = (req: express.Request, res: express.Response) => {
    try {
      const isGet = req.method === 'GET';
      const query = isGet
        ? (req.query.q as string) || (req.query.query as string) || ''
        : req.body?.query || '';

      const filters: SearchFilters = isGet ? {} : { ...(req.body?.filters || {}) };
      if (isGet) {
        if (req.query.profession && req.query.profession !== 'All') {
          filters.profession = req.query.profession as any;
        }
        if (req.query.availability && req.query.availability !== 'all') {
          filters.availability = req.query.availability as any;
        }
        if (req.query.maxDistance || req.query.maxDistanceKm) {
          filters.maxDistanceKm = Number(req.query.maxDistance || req.query.maxDistanceKm);
        }
        if (req.query.minRating) {
          filters.minRating = Number(req.query.minRating);
        }
        if (req.query.minExperience || req.query.minExperienceYears) {
          filters.minExperienceYears = Number(req.query.minExperience || req.query.minExperienceYears);
        }
        if (req.query.priceTier && req.query.priceTier !== 'all') {
          filters.priceTier = req.query.priceTier as any;
        }
        if (req.query.emergencyOnly === 'true') {
          filters.emergencyOnly = true;
        }
      }

      const customerCoords = {
        name: (isGet ? (req.query.locationName as string) : req.body?.customerCoords?.name) || 'Vaishali Nagar, Jaipur',
        lat: Number(isGet ? (req.query.lat || 26.9124) : (req.body?.customerCoords?.lat ?? 26.9124)),
        lng: Number(isGet ? (req.query.lng || 75.7433) : (req.body?.customerCoords?.lng ?? 75.7433)),
      };

      const manualOverrides = isGet ? { ...filters } : (req.body?.manualOverrides || {});

      const allWorkers = db.getWorkers();
      const config = db.getConfig();

      // Step A: Parse Natural Language Query
      const nlpAnalysis = parseNaturalLanguageQuery(query, customerCoords);

      // Step B: Determine Active Filters
      // Apply automatic filters unless customer explicitly manually overrode them
      const activeFilters: SearchFilters = { ...filters };

      if (!manualOverrides.profession && nlpAnalysis.autoFiltersApplied.profession && !activeFilters.profession) {
        activeFilters.profession = nlpAnalysis.autoFiltersApplied.profession;
      }
      if (!manualOverrides.availability && nlpAnalysis.autoFiltersApplied.availability && !activeFilters.availability) {
        activeFilters.availability = nlpAnalysis.autoFiltersApplied.availability as any;
      }
      if (!manualOverrides.maxDistanceKm && nlpAnalysis.autoFiltersApplied.maxDistanceKm && !activeFilters.maxDistanceKm) {
        activeFilters.maxDistanceKm = nlpAnalysis.autoFiltersApplied.maxDistanceKm;
      }
      if (!manualOverrides.minRating && nlpAnalysis.autoFiltersApplied.minRating && !activeFilters.minRating) {
        activeFilters.minRating = nlpAnalysis.autoFiltersApplied.minRating;
      }
      if (!manualOverrides.priceTier && nlpAnalysis.autoFiltersApplied.priceTier && !activeFilters.priceTier) {
        activeFilters.priceTier = nlpAnalysis.autoFiltersApplied.priceTier;
      }
      if (!manualOverrides.emergencyOnly && nlpAnalysis.autoFiltersApplied.emergencyService) {
        activeFilters.emergencyOnly = true;
      }

      // Step C: Hard Filtering (remove completely unsuitable workers)
      const hardFilteredWorkers = performHardFiltering(allWorkers, {
        requiredProfession: activeFilters.profession,
        requiredSkills: nlpAnalysis.extractedSkills,
        customerCoords,
        availabilityConstraint: activeFilters.availability,
        maxDistanceKm: activeFilters.maxDistanceKm,
        emergencyOnly: activeFilters.emergencyOnly,
      });

      // Step D: Manual Filtering (apply customer-selected sliders/criteria)
      const finalFilteredWorkers = performManualFiltering(
        hardFilteredWorkers,
        activeFilters,
        customerCoords
      );

      // Step E: Ranking Engine (Bayesian ratings, dynamic weights, reliability, distance, tags, explanations)
      const rankedWorkers = rankWorkers(
        finalFilteredWorkers,
        customerCoords,
        {
          profession: activeFilters.profession || nlpAnalysis.extractedProfession,
          service: nlpAnalysis.extractedService,
          skills: nlpAnalysis.extractedSkills,
          urgency: nlpAnalysis.urgency,
          rawQuery: query,
        },
        config
      );

      res.json({
        results: rankedWorkers,
        rankedWorkers,
        analysis: nlpAnalysis,
        nlpAnalysis,
        totalCandidates: allWorkers.length,
        hardFilteredCount: hardFilteredWorkers.length,
        matchedCount: rankedWorkers.length,
        activeFilters,
        appliedWeights: rankedWorkers.length > 0 ? rankedWorkers[0].appliedWeights : config.rankingWeights,
      });
    } catch (err: any) {
      console.error('Error during search processing:', err);
      res.status(500).json({ error: 'Search processing error', message: err?.message });
    }
  };

  app.get('/api/search', handleSearch);
  app.post('/api/search', handleSearch);

  // 4. Workers endpoints
  app.get('/api/workers', (req, res) => {
    res.json({ workers: db.getWorkers() });
  });

  app.get('/api/workers/:id', (req, res) => {
    const worker = db.getWorkerById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json({ worker });
  });

  app.patch('/api/workers/:id', (req, res) => {
    const updated = db.updateWorker(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Worker not found' });
    res.json({ worker: updated });
  });

  app.patch('/api/workers/:id/availability', (req, res) => {
    const { availability } = req.body;
    const updated = db.updateWorker(req.params.id, { currentAvailability: availability });
    if (!updated) return res.status(404).json({ error: 'Worker not found' });
    res.json({ worker: updated });
  });

  app.patch('/api/workers/:id/skills', (req, res) => {
    const { skills } = req.body;
    const updated = db.updateWorker(req.params.id, { skills });
    if (!updated) return res.status(404).json({ error: 'Worker not found' });
    res.json({ worker: updated });
  });

  // 5. Bookings endpoints
  app.get('/api/bookings', (req, res) => {
    const { customerId, workerId } = req.query;
    let list = db.getBookings();
    if (customerId) list = list.filter(b => b.customerId === customerId);
    if (workerId) list = list.filter(b => b.workerId === workerId);
    res.json({ bookings: list });
  });

  app.post('/api/bookings', (req, res) => {
    const {
      customerId,
      customerName,
      customerPhone,
      workerId,
      workerName,
      profession,
      serviceTitle,
      description,
      scheduledTime,
      address,
      estimatedPrice,
    } = req.body;

    if (!customerId || !workerId || !serviceTitle) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const newBooking: Booking = {
      id: `b_${Date.now()}`,
      customerId,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '+91 98290 00000',
      workerId,
      workerName,
      profession,
      serviceTitle,
      description: description || 'Standard home repair service requested.',
      scheduledTime: scheduledTime || 'Immediately',
      status: 'pending',
      address: address || 'Jaipur Central',
      estimatedPrice: estimatedPrice || 350,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createBooking(newBooking);
    res.status(201).json({ booking: newBooking });
  });

  app.patch('/api/bookings/:id/status', (req, res) => {
    const { status, rating, review, cancellationReason } = req.body;
    const updated = db.updateBookingStatus(req.params.id, status, {
      rating,
      review,
      cancellationReason,
    });
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: updated });
  });

  // 6. Admin marketplace configuration endpoints
  app.get('/api/admin/config', (req, res) => {
    res.json({ config: db.getConfig() });
  });

  app.post('/api/admin/config', (req, res) => {
    const { rankingWeights, tagThresholds, bayesianPrior, explorationPercentage } = req.body;

    // Validate ranking weights sum to 100% if provided
    if (rankingWeights) {
      const sum =
        Number(rankingWeights.skillMatch || 0) +
        Number(rankingWeights.reliability || 0) +
        Number(rankingWeights.rating || 0) +
        Number(rankingWeights.experience || 0) +
        Number(rankingWeights.distance || 0) +
        Number(rankingWeights.availability || 0) +
        Number(rankingWeights.response || 0) +
        Number(rankingWeights.recentActivity || 0);

      if (Math.round(sum) !== 100) {
        return res.status(400).json({
          error: `Ranking weights must sum to exactly 100%. Current sum: ${sum}%`,
        });
      }
    }

    const updated = db.updateConfig(req.body);
    res.json({ config: updated });
  });

  app.post('/api/admin/reset', (req, res) => {
    const reset = db.resetConfig();
    res.json({ config: reset });
  });

  // 7. Auth & Demo profiles endpoints
  app.get('/api/auth/demo-users', (req, res) => {
    res.json({ users: db.getUsersWithProfiles() });
  });

  app.post('/api/auth/login', (req, res) => {
    const { emailOrPhone, password, role } = req.body;
    const cleanInput = (emailOrPhone || '').trim();
    const cleanPhoneDigits = cleanInput.replace(/\D/g, '');

    const usersWithProfiles = db.getUsersWithProfiles();

    // 1. Find user by email, phone, user id, worker id, or worker/user name
    const user = usersWithProfiles.find(u => {
      // Role filter if specified
      if (role && u.role !== role) return false;

      const emailMatch = u.email.toLowerCase() === cleanInput.toLowerCase();
      const phoneMatch = u.phone === cleanInput || (cleanPhoneDigits.length >= 7 && u.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits));
      const idMatch = u.id.toLowerCase() === cleanInput.toLowerCase();
      const workerIdMatch = u.workerProfile?.id?.toLowerCase() === cleanInput.toLowerCase();
      const nameMatch = u.name.toLowerCase() === cleanInput.toLowerCase() || u.workerProfile?.name?.toLowerCase() === cleanInput.toLowerCase();

      return emailMatch || phoneMatch || idMatch || workerIdMatch || nameMatch;
    });

    if (!user) {
      return res.status(401).json({
        error: `No account found for "${cleanInput}". Try entering worker email, phone, or name (e.g. rajesh.electric@example.com or Suresh Choudhary).`,
      });
    }

    // 2. Validate password if provided
    if (password && password.trim() !== '') {
      const expectedPassword = user.password || (user.role === 'worker' ? 'worker123' : user.role === 'admin' ? 'admin123' : 'customer123');
      const isValid =
        password.trim() === expectedPassword ||
        password.trim() === 'worker123' ||
        password.trim() === 'karyo123' ||
        password.trim() === '123456';

      if (!isValid) {
        return res.status(401).json({
          error: `Incorrect password for ${user.name}. Default password is: ${expectedPassword}`,
        });
      }
    }

    return res.json({ user });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, role, profession, skills, experienceYears, hourlyRate } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({ error: 'Name, phone, and role are required' });
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: email || `${phone.replace(/\D/g, '')}@karyo.local`,
      phone,
      role,
      avatar: `https://images.unsplash.com/photo-${role === 'worker' ? '1507003211169-0a1dd7228f2d' : '1535713875002-d1d0cf377fde'}?w=150&auto=format&fit=crop&q=80`,
      location: {
        name: 'Vaishali Nagar, Jaipur',
        lat: 26.9124,
        lng: 75.7433,
      },
    };

    db.addUser(newUser);

    if (role === 'worker') {
      const newWorker: WorkerProfile = {
        id: `w_${Date.now()}`,
        userId: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        profilePhoto: newUser.avatar,
        profession: profession || 'Electrician',
        skills: skills && skills.length ? skills : ['General Repairs', 'Maintenance'],
        bio: `Professional ${profession || 'technician'} providing verified home services.`,
        location: newUser.location,
        serviceRadiusKm: 10,
        languages: ['Hindi', 'English'],
        yearsOfExperience: Number(experienceYears || 2),
        priceTier: 'medium',
        hourlyRate: Number(hourlyRate || 300),
        currentAvailability: 'available_now',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '08:00', end: '20:00' },
        emergencyService: true,
        joinedDate: new Date().toISOString(),
        isNewWorker: true,
        statistics: {
          totalJobs: 0,
          acceptedJobs: 0,
          completedJobs: 0,
          cancelledJobs: 0,
          noShowJobs: 0,
          onTimeJobs: 0,
          avgResponseMinutes: 5,
          rating: 5.0,
          reviewCount: 0,
          repeatCustomers: 0,
          recentJobs30d: 0,
          recentCompleted30d: 0,
          recentCancelled30d: 0,
          lastActiveAt: new Date().toISOString(),
        },
      };
      db.addWorker(newWorker);
      newUser.workerProfile = newWorker;
    }

    res.status(201).json({ user: newUser });
  });

  // 8. User location update endpoint
  app.patch('/api/users/:id/location', (req, res) => {
    const { name, lat, lng } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Name, lat, and lng are required' });
    }
    const updatedUser = db.updateUser(req.params.id, {
      location: { name, lat: Number(lat), lng: Number(lng) }
    });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: updatedUser });
  });

  // 9. Google Maps Platform Proxy Endpoints (CORS-safe & Tier-2 Quota Guarded)
  app.get('/api/maps/reverse-geocode', async (req, res) => {
    const { lat, lng } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Maps API key not configured' });
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.status === 429 || data.status === 'OVER_QUERY_LIMIT' || data.status === 'RESOURCE_EXHAUSTED') {
        return res.status(429).json({ error: 'QUOTA_EXCEEDED', message: 'Google Maps Platform quota reached' });
      }
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        let locality = '';
        let sublocality = '';
        let city = '';
        for (const comp of best.address_components) {
          if (comp.types.includes('sublocality') || comp.types.includes('sublocality_level_1')) {
            sublocality = comp.long_name;
          }
          if (comp.types.includes('locality')) {
            locality = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_2')) {
            city = comp.long_name;
          }
        }
        const displayName = sublocality
          ? `${sublocality}, ${locality || city || 'Jaipur'}`
          : best.formatted_address;
        return res.json({
          formattedAddress: best.formatted_address,
          name: displayName,
          lat: best.geometry.location.lat,
          lng: best.geometry.location.lng,
          results: data.results.slice(0, 5),
        });
      }
      return res.json({ name: `${lat}, ${lng}`, lat: Number(lat), lng: Number(lng) });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reverse geocode', message: err?.message });
    }
  });

  app.get('/api/maps/geocode', async (req, res) => {
    const address = (req.query.address as string) || '';
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Maps API key not configured' });
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.status === 429 || data.status === 'OVER_QUERY_LIMIT' || data.status === 'RESOURCE_EXHAUSTED') {
        return res.status(429).json({ error: 'QUOTA_EXCEEDED', message: 'Google Maps Platform quota reached' });
      }
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        return res.json({
          formattedAddress: best.formatted_address,
          name: best.formatted_address,
          lat: best.geometry.location.lat,
          lng: best.geometry.location.lng,
          results: data.results.slice(0, 5),
        });
      }
      res.status(404).json({ error: 'No locations found' });
    } catch (err: any) {
      res.status(500).json({ error: 'Geocoding failed', message: err?.message });
    }
  });

  app.get('/api/maps/autocomplete', async (req, res) => {
    const input = (req.query.input as string) || '';
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Maps API key not configured' });
    }
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input,
          locationBias: {
            circle: {
              center: { latitude: 26.9124, longitude: 75.7433 },
              radius: 50000.0,
            },
          },
        }),
      });
      const data = await response.json();
      if (response.status === 429 || data.status === 'OVER_QUERY_LIMIT' || data.error?.status === 'RESOURCE_EXHAUSTED') {
        return res.status(429).json({ error: 'QUOTA_EXCEEDED', message: 'Google Maps Platform quota reached' });
      }
      const suggestions = (data.suggestions || []).map((s: any) => ({
        placeId: s.placePrediction?.placeId,
        name: s.placePrediction?.text?.text,
        mainText: s.placePrediction?.structuredFormat?.mainText?.text,
        secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text,
      }));
      res.json({ suggestions });
    } catch (err: any) {
      res.status(500).json({ error: 'Autocomplete failed', message: err?.message });
    }
  });

  app.get('/api/maps/place-details', async (req, res) => {
    const placeId = req.query.placeId as string;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Maps API key not configured' });
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.status === 429 || data.status === 'OVER_QUERY_LIMIT') {
        return res.status(429).json({ error: 'QUOTA_EXCEEDED' });
      }
      if (data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return res.json({
          name: data.results[0].formatted_address,
          lat: loc.lat,
          lng: loc.lng,
        });
      }
      res.status(404).json({ error: 'Place details not found' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message });
    }
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Karyo marketplace server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
