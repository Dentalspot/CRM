import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const fetchWallet = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching wallet:', error);
    return null;
  }
};

export const ensureWallet = async (userId) => {
  const existing = await fetchWallet(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchTransactions = async (walletId) => {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    return [];
  }
};

export const fetchWithdrawals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching withdrawals:', error);
    return [];
  }
};

// Usa RPC atómica — evita race condition entre débito y registro
export const requestWithdrawal = async (userId, _walletId, amount, bankDetails) => {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_user_id: userId,
    p_amount: amount,
    p_bank_data: bankDetails
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error('No se pudo procesar el retiro');
  return data;
};

// Compra con saldo — usa RPC atómica para evitar race conditions
export const purchaseWithWallet = async (userId, amount, itemId, itemTitle, sellerId = null) => {
  const { data, error } = await supabase.rpc('wallet_purchase', {
    p_buyer_id: userId,
    p_amount: amount,
    p_item_id: itemId,
    p_item_title: itemTitle,
    p_seller_id: sellerId,
    p_commission_rate: 0.10,
  });

  if (error) throw new Error(error.message || 'Error al procesar la compra');
  if (!data?.success) throw new Error(data?.message || 'No se pudo completar la compra');
  return data;
};