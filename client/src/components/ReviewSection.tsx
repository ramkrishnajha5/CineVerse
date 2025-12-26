import { useState, useEffect } from 'react';
import { Star, Send, Edit2, Trash2, User, MessageSquare, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    addReview,
    getReviews,
    deleteReview,
    getAverageRating,
    type Review
} from '@/lib/reviews';
import { getUserProfile } from '@/lib/firestore';

interface ReviewSectionProps {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
}

// Custom Delete Confirmation Modal
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-2">
                    Delete Review?
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
                    This action cannot be undone. Your review and rating will be permanently removed.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting...
                            </span>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// 10-Star Rating Component - Responsive
function StarRating({
    rating,
    onRatingChange,
    readonly = false,
    size = 'md'
}: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
        md: 'w-4 h-4 sm:w-5 sm:h-5',
        lg: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7'
    };

    const currentDisplay = hoverRating || rating;
    const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center flex-wrap gap-0.5">
                {stars.map((value) => {
                    const isFilled = value <= currentDisplay;

                    return (
                        <button
                            key={value}
                            type="button"
                            disabled={readonly}
                            className={`transition-all duration-150 p-0.5 ${readonly
                                    ? 'cursor-default'
                                    : 'cursor-pointer hover:scale-110 active:scale-95'
                                }`}
                            onMouseEnter={() => !readonly && setHoverRating(value)}
                            onMouseLeave={() => !readonly && setHoverRating(0)}
                            onClick={() => onRatingChange?.(value)}
                            aria-label={`Rate ${value} out of 10`}
                        >
                            <Star
                                className={`${sizeClasses[size]} transition-all duration-150 ${isFilled
                                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]'
                                        : 'text-zinc-300 dark:text-zinc-600'
                                    }`}
                            />
                        </button>
                    );
                })}
            </div>
            {currentDisplay > 0 && (
                <span className={`font-bold text-amber-500 dark:text-amber-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
                    }`}>
                    {currentDisplay}/10
                </span>
            )}
        </div>
    );
}

// Single Review Card
function ReviewCard({
    review,
    isOwner,
    onEdit,
    onDelete
}: {
    review: Review;
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasComment = review.comment && review.comment.trim().length > 0;
    const isLongComment = hasComment && review.comment.length > 200;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const displayComment = isLongComment && !expanded
        ? review.comment.slice(0, 200) + '...'
        : review.comment;

    return (
        <div className="group relative p-4 sm:p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-zinc-700 shadow-md flex-shrink-0">
                        <AvatarImage src={review.userPhotoURL || undefined} alt={review.userName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold text-sm">
                            {review.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm sm:text-base">
                            {review.userName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(review.createdAt)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            {review.rating}/10
                        </span>
                    </div>

                    {isOwner && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 text-zinc-500 hover:text-primary"
                                onClick={onEdit}
                                title="Edit review"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500"
                                onClick={onDelete}
                                title="Delete review"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Body */}
            {hasComment && (
                <div className="mt-3 pl-0 sm:pl-13">
                    <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {displayComment}
                    </p>

                    {isLongComment && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        >
                            {expanded ? (
                                <>Show less <ChevronUp className="w-4 h-4" /></>
                            ) : (
                                <>Read more <ChevronDown className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Main Component
export function ReviewSection({ tmdbId, mediaType, title }: ReviewSectionProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [, navigate] = useLocation();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(false); // Only true when user clicks Edit
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if user has already reviewed
    const userReview = user ? reviews.find(r => r.userId === user.uid) : null;

    // Fetch reviews
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [reviewsData, avgData] = await Promise.all([
                    getReviews(tmdbId),
                    getAverageRating(tmdbId)
                ]);

                if (mounted) {
                    setReviews(reviewsData);
                    setAverageRating(avgData);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [tmdbId, user]);

    const refreshReviews = async () => {
        const [reviewsData, avgData] = await Promise.all([
            getReviews(tmdbId),
            getAverageRating(tmdbId)
        ]);
        setReviews(reviewsData);
        setAverageRating(avgData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        if (rating === 0) {
            toast({ title: 'Please select a rating', variant: 'destructive' });
            return;
        }

        setSubmitting(true);

        try {
            const profile = await getUserProfile(user.uid);

            await addReview({
                tmdbId,
                mediaType,
                userId: user.uid,
                userName: profile?.name || user.displayName || user.email?.split('@')[0] || 'Anonymous',
                userPhotoURL: profile?.profilePicture || user.photoURL || null,
                rating,
                comment: comment.trim(),
            });

            await refreshReviews();

            // Reset form and editing state
            setRating(0);
            setComment('');
            setIsEditing(false);
            setEditingReviewId(null);

            toast({ title: editingReviewId ? 'Review updated!' : 'Review submitted!' });
        } catch (error: any) {
            console.error('Error submitting review:', error);

            if (error?.message?.includes('index')) {
                toast({
                    title: 'One-time Setup Needed',
                    description: 'Click the link in browser console to create Firestore index.',
                    variant: 'destructive'
                });
            } else {
                toast({ title: 'Failed to submit. Please try again.', variant: 'destructive' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (review: Review) => {
        setRating(review.rating);
        setComment(review.comment || '');
        setIsEditing(true);
        setEditingReviewId(review.id || null);
        document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleDeleteClick = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!reviewToDelete) return;

        setIsDeleting(true);
        try {
            await deleteReview(reviewToDelete);
            await refreshReviews();
            setRating(0);
            setComment('');
            setIsEditing(false);
            setEditingReviewId(null);
            toast({ title: 'Review deleted successfully' });
        } catch (error) {
            console.error('Error deleting review:', error);
            toast({ title: 'Failed to delete review', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setReviewToDelete(null);
        }
    };

    const handleCancelEdit = () => {
        setRating(0);
        setComment('');
        setIsEditing(false);
        setEditingReviewId(null);
    };

    // Determine whether to show the form
    const showForm = !userReview || isEditing;

    return (
        <section className="mt-12 sm:mt-14">
            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setReviewToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                        Reviews & Ratings
                    </h2>
                </div>

                {averageRating.count > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {averageRating.average}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 text-sm">/10</span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                            {averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                )}
            </div>

            {/* Review Form - Only show if user hasn't reviewed OR is editing */}
            {user && showForm && (
                <div
                    id="review-form"
                    className="mb-6 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-100 dark:shadow-none"
                >
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                        {isEditing ? '✏️ Edit Your Review' : `⭐ Rate "${title}"`}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Rating - Required */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                Your Rating <span className="text-red-500">*</span>
                            </label>
                            <StarRating
                                rating={rating}
                                onRatingChange={setRating}
                                size="lg"
                            />
                        </div>

                        {/* Comment - Optional */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Your Review <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your thoughts... (optional)"
                                maxLength={1000}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl text-sm sm:text-base resize-none
                  bg-zinc-50 dark:bg-zinc-800 
                  text-zinc-900 dark:text-white
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  border border-zinc-200 dark:border-zinc-700
                  focus:border-primary dark:focus:border-primary
                  focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30
                  focus:outline-none transition-all duration-200"
                            />
                            <div className="flex justify-end mt-1">
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                    {comment.length}/1000
                                </span>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="submit"
                                disabled={submitting || rating === 0}
                                className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Send className="w-4 h-4" />
                                        {isEditing ? 'Update Review' : 'Submit Rating'}
                                    </span>
                                )}
                            </Button>

                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2.5 rounded-xl border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Login Prompt for non-logged in users */}
            {!user && (
                <div className="mb-6 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-100 dark:shadow-none">
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                        ✍️ Login to Rate & Review
                    </h3>
                    <div className="text-center py-6 sm:py-8">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <User className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400" />
                        </div>
                        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-4">
                            Sign in to rate and review this {mediaType === 'movie' ? 'movie' : 'show'}.
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-xl shadow-lg shadow-primary/20"
                        >
                            Login to Review
                        </Button>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 sm:p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-lg" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-10 sm:py-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Star className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        No Reviews Yet
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Be the first to rate this {mediaType === 'movie' ? 'movie' : 'show'}!
                    </p>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            isOwner={user?.uid === review.userId}
                            onEdit={() => handleEdit(review)}
                            onDelete={() => review.id && handleDeleteClick(review.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default ReviewSection;
