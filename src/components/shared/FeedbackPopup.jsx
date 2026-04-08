import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Star, Gift, Wallet, Send, Loader2 } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const FEEDBACK_KEY = 'dentalspot_feedback_dismissed';
const DAYS_BEFORE_SHOW = 7;

const FeedbackPopup = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    checkIfShouldShow();
  }, [user, profile]);

  const checkIfShouldShow = async () => {
    // Only for therapists
    if (profile?.role !== 'therapist') return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(FEEDBACK_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) return; // Don't show for 30 days after dismissing
    }

    // Check if already submitted feedback
    const { data: existing } = await supabase
      .from('platform_feedback')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return; // Already gave feedback

    // Check if account is at least 7 days old
    const createdAt = new Date(profile.created_at || user.created_at);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation >= DAYS_BEFORE_SHOW) {
      // Show after 3 second delay
      setTimeout(() => setVisible(true), 3000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(FEEDBACK_KEY, new Date().toISOString());
    setVisible(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      // Save feedback
      const { error: feedbackError } = await supabase.from('platform_feedback').insert({
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        reward_granted: true,
        reward_amount: 30000,
      });

      if (feedbackError) throw feedbackError;

      // Add reward to wallet
      const { data: userWallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userWallet) {
        // Check if already rewarded
        const { data: existing } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('wallet_id', userWallet.id)
          .eq('description', 'Recompensa por feedback de plataforma')
          .maybeSingle();

        if (!existing) {
          await supabase.from('wallet_transactions').insert({
            wallet_id: userWallet.id,
            type: 'credit',
            amount: 30000,
            description: 'Recompensa por feedback de plataforma',
            status: 'completed',
          });

          // Update wallet balance
          await supabase.from('wallets')
            .update({
              balance: (userWallet.balance || 0) + 30000,
              last_updated: new Date().toISOString()
            })
            .eq('id', userWallet.id);
        }
      }

      setSubmitted(true);
      toast({
        title: '$30.000 acreditados en tu wallet',
        description: 'Gracias por tu feedback. Puedes usar tu saldo en el Marketplace.',
      });

      // Auto close after 4 seconds
      setTimeout(() => setVisible(false), 4000);
    } catch (err) {
      logger.error('Feedback error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar tu feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          /* Success state */
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Gracias por tu feedback</h3>
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-semibold">
              <Wallet className="h-5 w-5" />
              $30.000 acreditados en tu wallet
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Puedes usar tu saldo para comprar planificaciones, talleres y más en el Marketplace.
            </p>
          </div>
        ) : (
          <>
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Gift className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Tu opinión vale $30.000</h3>
                  <p className="text-sm text-white/80">Cuéntanos tu experiencia con DentalSpot</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Reward info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Responde y recibe <strong>$30.000 en tu wallet</strong> para comprar materiales en el Marketplace.
                </p>
              </div>

              {/* Star rating */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">¿Cómo calificarías DentalSpot?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hoveredStar || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {rating === 1 && 'Necesita mejorar'}
                    {rating === 2 && 'Regular'}
                    {rating === 3 && 'Bueno'}
                    {rating === 4 && 'Muy bueno'}
                    {rating === 5 && 'Excelente'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ¿Qué podríamos mejorar? (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={3}
                  placeholder="Tu feedback nos ayuda a construir una mejor plataforma..."
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar y recibir $30.000</>
                )}
              </Button>

              <button
                onClick={handleDismiss}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
              >
                Recordarme más tarde
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackPopup;
