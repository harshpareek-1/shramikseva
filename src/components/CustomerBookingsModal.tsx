import React, { useState } from 'react';
import { Booking } from '../types.ts';
import { X, Calendar, MapPin, Clock, Star, CheckCircle, AlertCircle, Phone } from 'lucide-react';

interface CustomerBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onRateBooking: (bookingId: string, rating: number, review: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const CustomerBookingsModal: React.FC<CustomerBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onRateBooking,
  onCancelBooking,
}) => {
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!isOpen) return null;

  const handleReviewSubmit = async (bookingId: string) => {
    setIsSubmittingReview(true);
    await onRateBooking(bookingId, selectedStars, reviewText);
    setIsSubmittingReview(false);
    setRatingBookingId(null);
    setReviewText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white min-h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-extrabold text-slate-900">My Service Bookings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">No Bookings Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Find an electrician, plumber, carpenter, painter, or cleaner to book on-demand services.
              </p>
            </div>
          ) : (
            bookings.map(b => {
              const statusColors: Record<Booking['status'], string> = {
                pending: 'bg-amber-100 text-amber-800 border-amber-200',
                accepted: 'bg-sky-100 text-sky-800 border-sky-200',
                en_route: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
                in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
                completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
              };

              return (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {b.serviceTitle}
                        </h4>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        Worker: <strong className="text-slate-900">{b.workerName}</strong> ({b.profession})
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                        statusColors[b.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled</span>
                      <span className="font-semibold text-slate-800">{b.scheduledTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Fee</span>
                      <span className="font-semibold text-emerald-700">₹{b.estimatedPrice}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Address</span>
                      <span className="font-medium text-slate-700 truncate block">{b.address}</span>
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex items-center justify-between pt-1">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => onCancelBooking(b.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                      >
                        Cancel Request
                      </button>
                    )}

                    {b.status === 'completed' && !b.rating && ratingBookingId !== b.id && (
                      <button
                        onClick={() => {
                          setRatingBookingId(b.id);
                          setSelectedStars(5);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Rate This Service</span>
                      </button>
                    )}

                    {b.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <span>You rated:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= b.rating! ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Input Box */}
                  {ratingBookingId === b.id && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950">
                          How was your experience with {b.workerName}?
                        </span>
                        <button
                          onClick={() => setRatingBookingId(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedStars(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= selectedStars
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={2}
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder="Write a brief comment about their quality, punctuality, and behavior..."
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs focus:border-amber-500 focus:outline-hidden"
                      />

                      <button
                        onClick={() => handleReviewSubmit(b.id)}
                        disabled={isSubmittingReview}
                        className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        {isSubmittingReview ? 'Submitting Rating...' : 'Submit Rating & Update Worker Score'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
