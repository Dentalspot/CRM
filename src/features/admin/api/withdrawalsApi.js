import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const fetchAllWithdrawals = async (statusFilter = 'all') => {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        user:profiles!user_id(full_name, email, rut)
      `)
      .order('requested_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching admin withdrawals:', error);
    throw error;
  }
};

export const updateWithdrawalStatus = async (requestId, newStatus, adminNotes = '') => {
  try {
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*, user_id, wallet_id, amount')
      .eq('id', requestId)
      .single();
      
    if (fetchError) throw fetchError;

    // Update Status
    const updateData = { 
      status: newStatus, 
      admin_notes: adminNotes,
      processed_at: newStatus !== 'pending' ? new Date().toISOString() : null
    };

    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Handle Logic based on Status
    if (newStatus === 'rejected') {
      // Refund money to wallet
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', request.wallet_id).single();
      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + request.amount })
          .eq('id', request.wallet_id);

        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: request.wallet_id,
            type: 'credit',
            amount: request.amount,
            description: `Reembolso por retiro rechazado: ${adminNotes}`,
            reference_id: requestId,
            reference_type: 'refund'
          });
      }
    }

    // Notifications
    let message = '';
    if (newStatus === 'completed') message = 'Tu solicitud de retiro ha sido completada. Los fondos han sido enviados a tu cuenta.';
    if (newStatus === 'rejected') message = `Tu solicitud de retiro fue rechazada. Motivo: ${adminNotes}. Los fondos han sido devueltos a tu billetera.`;
    if (newStatus === 'processing') message = 'Tu solicitud de retiro está siendo procesada por el banco.';

    if (message) {
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'system',
        title: `Actualización de Retiro: ${newStatus === 'completed' ? 'Completado' : newStatus === 'rejected' ? 'Rechazado' : 'Procesando'}`,
        message: message,
        read: false
      });
    }

    return true;
  } catch (error) {
    logger.error('Error updating withdrawal:', error);
    throw error;
  }
};