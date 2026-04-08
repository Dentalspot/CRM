import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const REWARD_AMOUNT = 10000;

/**
 * Checks if the user was invited, and if so, whether they have completed
 * their profile enough to credit the inviter with reward credits.
 *
 * @param {string} userId - The ID of the newly registered/updated user (invitee)
 * @returns {Promise<{ credited: boolean, message: string }>}
 */
export const checkAndCreditInviteReward = async (userId) => {
  try {
    // 1. Find an uncredited accepted invitation where this user is the invitee
    const { data: invitation, error: invError } = await supabase
      .from('therapist_invitations')
      .select('id, inviter_id, reward_credited')
      .eq('invitee_id', userId)
      .eq('status', 'accepted')
      .eq('reward_credited', false)
      .maybeSingle();

    if (invError || !invitation) {
      return { credited: false, message: 'No hay invitación pendiente de recompensa.' };
    }

    // 2. Check profile completion (10 steps)
    const checks = await Promise.all([
      supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
      supabase.from('therapist_branding').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('therapist_specialties').select('id').eq('therapist_id', userId).maybeSingle(),
      supabase.from('therapist_availabilities').select('id').eq('therapist_id', userId).maybeSingle(),
      supabase.from('clinics').select('id').eq('therapist_id', userId).maybeSingle(),
      supabase.from('therapist_education').select('id').eq('therapist_id', userId).maybeSingle(),
      supabase.from('therapist_details').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('therapist_subscriptions').select('id').eq('therapist_id', userId).maybeSingle(),
      supabase.from('therapist_documents').select('id').eq('therapist_id', userId).maybeSingle(),
    ]);

    const completedSteps = checks.filter(({ data }) => data !== null).length;

    if (completedSteps < 4) {
      return {
        credited: false,
        message: `Perfil incompleto (${completedSteps}/4 pasos mínimos). Completa tu perfil para desbloquear la recompensa.`
      };
    }

    // 3. Ensure inviter wallet exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', invitation.inviter_id)
      .maybeSingle();

    let walletId;
    if (!existingWallet) {
      const { data: newWallet, error: walletError } = await supabase
        .from('wallets')
        .insert({ user_id: invitation.inviter_id, balance: 0 })
        .select()
        .single();
      if (walletError) throw walletError;
      walletId = newWallet.id;
    } else {
      walletId = existingWallet.id;
    }

    // 4. Credit inviter wallet
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        amount: REWARD_AMOUNT,
        type: 'credit',
        description: `Recompensa por invitación aceptada (invitado completó perfil)`
      });

    if (txError) throw txError;

    // Update wallet balance
    await supabase.rpc('increment_wallet_balance', {
      p_wallet_id: walletId,
      p_amount: REWARD_AMOUNT
    }).catch(() => {
      // Fallback if RPC not available
      supabase
        .from('wallets')
        .update({ balance: (existingWallet?.balance ?? 0) + REWARD_AMOUNT })
        .eq('id', walletId);
    });

    // 5. Mark invitation as reward_credited
    const { error: updateError } = await supabase
      .from('therapist_invitations')
      .update({ reward_credited: true, reward_amount: REWARD_AMOUNT })
      .eq('id', invitation.id);

    if (updateError) throw updateError;

    return {
      credited: true,
      message: `¡Se acreditaron ${REWARD_AMOUNT} créditos al odontólogo que te invitó!`
    };

  } catch (error) {
    logger.error('Error in checkAndCreditInviteReward:', error);
    return { credited: false, message: error.message || 'Error al verificar recompensa.' };
  }
};
