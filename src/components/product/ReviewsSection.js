'use client';
import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import axios from 'axios';
import { useApp } from '@/lib/AppContext';
import toast from 'react-hot-toast';

export default function ReviewsSection({ productId, reviews = [], onReviewAdded }) {
  const { user, getAuthHeaders } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/products/${productId}/reviews`, { rating, comment }, { headers: getAuthHeaders() });
      if (data.success) { toast.success('Review submitted! It will appear after approval.'); setComment(''); setRating(5); if (onReviewAdded) onReviewAdded(); }
      else toast.error(data.message || 'Failed to submit review');
    } catch (err) { toast.error(err.response?.data?.message || 'Error submitting review'); }
    setSubmitting(false);
  };

  const approvedReviews = reviews.filter(r => r.approved);

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Reviews ({approvedReviews.length})</h3>

      {approvedReviews.length === 0 ? (
        <p className="text-gray-500 text-sm mb-6">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4 mb-6">
          {approvedReviews.map((r, i) => (
            <div key={i} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">{[1,2,3,4,5].map(s => <FiStar key={s} size={13} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}</div>
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit}>
          <h4 className="font-semibold text-gray-700 mb-3">Write a Review</h4>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button type="button" key={s} onClick={() => setRating(s)}>
                <FiStar size={24} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={3}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-em-blue mb-3" />
          <button type="submit" disabled={submitting} className="bg-em-blue text-white px-5 py-2 rounded text-sm font-semibold hover:bg-em-blue-dark disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">Please <a href="/login" className="text-em-blue font-semibold">login</a> to write a review.</p>
      )}
    </div>
  );
}
