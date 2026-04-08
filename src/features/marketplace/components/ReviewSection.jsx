import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Loader2,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { 
  fetchItemReviews, 
  checkUserPurchase, 
  submitReview, 
  castVote, 
  getUserVote 
} from '../api/reviewsApi';

// Star Rating Component
const StarRating = ({ rating, max = 5, onRatingChange, readOnly = false, size = "md" }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        return (
          <Star
            key={i}
            className={cn(
              starSize,
              "transition-all duration-200",
              isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
              !readOnly && "cursor-pointer hover:scale-110"
            )}
            onClick={() => !readOnly && onRatingChange && onRatingChange(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
          />
        );
      })}
    </div>
  );
};

// Single Review Item Component
const ReviewItem = ({ review, currentUser }) => {
  const [userVote, setUserVote] = useState(null);
  const [votes, setVotes] = useState({ helpful: review.helpful_count, unhelpful: review.not_helpful_count });
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      getUserVote(review.id, currentUser.id).then(setUserVote);
    }
  }, [review.id, currentUser]);

  const handleVote = async (type) => {
    if (!currentUser) {
      toast({ title: "Debes iniciar sesión para votar", variant: "destructive" });
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    try {
      const result = await castVote(review.id, currentUser.id, type);
      
      // Update local state optimistically
      let newHelpful = votes.helpful;
      let newUnhelpful = votes.unhelpful;

      // Determine previous state changes
      if (userVote === 'helpful') newHelpful--;
      if (userVote === 'unhelpful') newUnhelpful--;

      // Apply new state
      if (result) {
        if (result.vote_type === 'helpful') newHelpful++;
        if (result.vote_type === 'unhelpful') newUnhelpful++;
        setUserVote(result.vote_type);
      } else {
        setUserVote(null);
      }

      setVotes({ helpful: newHelpful, unhelpful: newUnhelpful });

    } catch (error) {
      logger.error(error);
      toast({ title: "Error al registrar voto", variant: "destructive" });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="py-6 first:pt-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-gray-100">
            <AvatarImage src={review.reviewer?.avatar_url} />
            <AvatarFallback className="bg-teal-50 text-teal-700">
              {review.reviewer?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm text-gray-900">{review.reviewer?.full_name || 'Usuario'}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <StarRating rating={review.rating} readOnly size="sm" />
              <span>•</span>
              <span>{format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pl-13">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>

        <div className="flex items-center gap-4 mt-4">
          <button 
            onClick={() => handleVote('helpful')}
            disabled={isVoting}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors p-1.5 rounded-md hover:bg-gray-50",
              userVote === 'helpful' ? "text-teal-600" : "text-gray-500"
            )}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", userVote === 'helpful' && "fill-current")} />
            <span>Útil ({votes.helpful})</span>
          </button>
          
          <button 
            onClick={() => handleVote('unhelpful')}
            disabled={isVoting}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors p-1.5 rounded-md hover:bg-gray-50",
              userVote === 'unhelpful' ? "text-red-500" : "text-gray-500"
            )}
          >
            <ThumbsDown className={cn("h-3.5 w-3.5", userVote === 'unhelpful' && "fill-current")} />
            <span>No útil ({votes.unhelpful})</span>
          </button>
        </div>
      </div>
      <Separator className="mt-6" />
    </div>
  );
};

// Main Review Section Component
const ReviewSection = ({ itemId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState(null); // If user already reviewed
  
  // New Review Form State
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemId) {
      loadData();
    }
  }, [itemId, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedReviews, purchased] = await Promise.all([
        fetchItemReviews(itemId),
        checkUserPurchase(itemId, user?.id)
      ]);
      
      setReviews(fetchedReviews || []);
      setHasPurchased(purchased);

      // Check if user already reviewed
      if (user) {
        const existing = fetchedReviews.find(r => r.reviewer_id === user.id);
        if (existing) {
          setUserReview(existing);
          setNewRating(existing.rating);
          setNewComment(existing.comment || '');
        }
      }
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast({ title: "Por favor selecciona una calificación", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Por favor escribe un comentario", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        item_id: itemId,
        reviewer_id: user.id,
        rating: newRating,
        comment: newComment
      };

      const savedReview = await submitReview(reviewData);
      
      // Update local state
      if (userReview) {
        // Update existing in list
        setReviews(prev => prev.map(r => r.id === savedReview.id ? savedReview : r));
        toast({ title: "Reseña actualizada correctamente" });
      } else {
        // Add new to list (and refetch to get reviewer details properly populated if needed, or manually construct)
        const enrichedReview = {
          ...savedReview,
          reviewer: {
            full_name: user.user_metadata?.full_name || 'Tú',
            avatar_url: user.user_metadata?.avatar_url
          }
        };
        setReviews(prev => [enrichedReview, ...prev]);
        toast({ title: "Reseña publicada correctamente" });
      }
      
      setUserReview(savedReview);
    } catch (error) {
      logger.error(error);
      toast({ title: "Error al publicar reseña", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats Calculation
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : 0;
  
  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === stars).length / totalReviews) * 100 : 0
  }));

  if (loading) {
    return <div className="py-10 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando reseñas...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Opiniones de clientes</h3>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
            <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
            <div className="flex flex-col items-start">
              <StarRating rating={Math.round(averageRating)} readOnly />
              <span className="text-sm text-gray-500 mt-1">{totalReviews} valoraciones</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-2">
            {ratingCounts.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-3 font-medium text-gray-600">{item.stars}</span>
                <Star className="h-3 w-3 text-gray-300" />
                <Progress value={item.percentage} className="h-2 flex-1" indicatorClassName="bg-yellow-400" />
                <span className="w-8 text-right text-gray-400">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Review Form */}
      {hasPurchased ? (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4">
            {userReview ? 'Edita tu reseña' : 'Escribe una reseña'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
              <StarRating rating={newRating} onRatingChange={setNewRating} size="lg" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu opinión</label>
              <Textarea 
                placeholder="¿Qué te pareció este recurso? ¿Cómo te ayudó?" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-white min-h-[100px]"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitReview} 
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {userReview ? 'Actualizar' : 'Publicar Reseña'}
              </Button>
            </div>
          </div>
        </div>
      ) : user ? (
        !userReview && (
          <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            Solo los usuarios que han comprado este recurso pueden dejar una reseña.
          </div>
        )
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-500">
          Inicia sesión y adquiere el producto para dejar tu opinión.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-2">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem key={review.id} review={review} currentUser={user} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Aún no hay reseñas para este producto.</p>
            {hasPurchased && <p className="text-sm mt-1">¡Sé el primero en opinar!</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;