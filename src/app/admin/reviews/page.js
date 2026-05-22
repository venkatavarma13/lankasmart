'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import { useApp } from '@/lib/AppContext';
import { FiStar, FiMessageSquare, FiTrash2, FiCheck, FiX, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <FiStar key={s} size={13} className={s <= rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'} />
    ))}
  </div>
);

export default function AdminReviews() {
  const { user, loading, getAuthHeaders } = useApp();
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [loading, user, router]);

  const fetchReviews = async () => {
    setFetching(true);
    try {
      const { data } = await axios.get('/api/admin/reviews', { headers: getAuthHeaders() });
      if (data.success) { setReviews(data.reviews); setTotal(data.total); }
    } catch {}
    setFetching(false);
  };

  useEffect(() => { if (user?.role === 'admin') fetchReviews(); }, [user]);

  const handleReply = async () => {
    if (!replyText.trim()) { toast.error('Please enter a reply'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.put(
        `/api/admin/reviews?id=${replyModal._id}`,
        { action: 'reply', replyText },
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        toast.success('Reply posted!');
        setReplyModal(null);
        setReplyText('');
        fetchReviews();
      }
    } catch { toast.error('Failed to reply'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await axios.put(`/api/admin/reviews?id=${id}`, { action: 'delete' }, { headers: getAuthHeaders() });
      toast.success('Review deleted');
      fetchReviews();
    } catch { toast.error('Delete failed'); }
  };

  const handleApprove = async (id, approve) => {
    try {
      await axios.put(`/api/admin/reviews?id=${id}`, { action: 'approve', isApproved: approve }, { headers: getAuthHeaders() });
      toast.success(approve ? 'Review approved' : 'Review hidden');
      fetchReviews();
    } catch { toast.error('Action failed'); }
  };

  const timeAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
  };

  if (loading || !user) return null;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total reviews</p>
        </div>

        {fetching ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className={`bg-white rounded-xl shadow-card overflow-hidden border-l-4 ${
                review.isApproved ? 'border-green-400' : 'border-gray-300'
              }`}>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-em-blue to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {review.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-800 text-sm">{review.userName}</p>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <FiCheck size={10} /> Verified
                            </span>
                          )}
                          {!review.isApproved && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Hidden</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{review.user?.email} · {timeAgo(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                        <FiStar size={13} className="fill-orange-400 text-orange-400" />
                        <span className="text-sm font-bold text-orange-600">{review.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product */}
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="relative w-10 h-10 bg-white rounded flex-shrink-0">
                      {review.product?.images?.[0]?.url
                        ? <Image src={review.product.images[0].url} alt="" fill className="object-contain p-1" sizes="40px" />
                        : <div className="w-full h-full flex items-center justify-center text-base">⚡</div>
                      }
                    </div>
                    <p className="text-xs font-semibold text-gray-700 line-clamp-1">{review.product?.name}</p>
                  </div>

                  {/* Review content */}
                  {review.title && <p className="font-bold text-gray-800 text-sm mb-1">{review.title}</p>}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>

                  {/* Photos */}
                  {review.photos?.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {review.photos.map((p, i) => (
                        <button key={i} onClick={() => setPhotoModal(p.url)}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-em-blue transition-colors">
                          <Image src={p.url} alt="" fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FiCamera size={12} /> {review.photos.length} photo{review.photos.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Admin reply */}
                  {review.adminReply?.text && (
                    <div className="bg-blue-50 border-l-4 border-em-blue rounded-r-lg p-3 mb-3">
                      <p className="text-xs font-bold text-em-blue mb-1">Your Reply</p>
                      <p className="text-sm text-gray-700">{review.adminReply.text}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                    <button onClick={() => { setReplyModal(review); setReplyText(review.adminReply?.text || ''); }}
                      className="flex items-center gap-1.5 text-xs text-em-blue border border-em-blue px-3 py-1.5 rounded-lg hover:bg-blue-50 font-semibold transition-colors">
                      <FiMessageSquare size={13} /> {review.adminReply?.text ? 'Edit Reply' : 'Reply'}
                    </button>
                    <button onClick={() => handleApprove(review._id, !review.isApproved)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                        review.isApproved
                          ? 'text-gray-500 border-gray-300 hover:bg-gray-50'
                          : 'text-green-600 border-green-400 hover:bg-green-50'
                      }`}>
                      {review.isApproved ? <><FiX size={13} /> Hide</> : <><FiCheck size={13} /> Approve</>}
                    </button>
                    <button onClick={() => handleDelete(review._id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                      <FiTrash2 size={13} /> Delete
                    </button>
                    <div className="ml-auto flex items-center gap-1.5">
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-gray-400">({review.helpful || 0} helpful)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-xl mb-1">Reply to Review</h3>
            <p className="text-sm text-gray-500 mb-4">by {replyModal.userName}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 italic">
              "{replyModal.comment}"
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply as L MART..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-em-blue resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setReplyModal(null); setReplyText(''); }}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleReply} disabled={submitting || !replyText.trim()}
                className="flex-1 bg-em-blue hover:bg-em-blue-dark disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                {submitting ? 'Posting...' : '💬 Post Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoModal(null)}>
          <div className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden">
            <Image src={photoModal} alt="Review photo" fill className="object-contain" sizes="512px" />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
