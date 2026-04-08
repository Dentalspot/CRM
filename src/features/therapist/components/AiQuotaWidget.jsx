
import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { Progress } from '@/components/ui/progress';

const AiQuotaWidget = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [callsUsed, setCallsUsed] = useState(0);
  const [callsLimit, setCallsLimit] = useState(10);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAiQuota = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const periodStart = `${year}-${month}-01`;

        const [usageRes, subRes] = await Promise.all([
          supabase
            .from('ai_usage_quotas')
            .select('calls_used')
            .eq('therapist_id', currentUser.id)
            .gte('period_start', periodStart)
            .maybeSingle(),
          supabase
            .from('therapist_subscriptions')
            .select('plan_name')
            .eq('therapist_id', currentUser.id)
            .eq('status', 'active')
            .maybeSingle()
        ]);

        if (usageRes.error && usageRes.error.code !== 'PGRST116') {
          throw usageRes.error;
        }
        
        if (subRes.error && subRes.error.code !== 'PGRST116') {
          throw subRes.error;
        }

        const used = usageRes.data?.calls_used || 0;
        setCallsUsed(used);

        const planName = subRes.data?.plan_name || 'Gratis';

        const limitRes = await supabase
          .from('ai_plan_limits')
          .select('max_calls_per_month')
          .eq('plan_name', planName)
          .maybeSingle();

        if (limitRes.error && limitRes.error.code !== 'PGRST116') {
          throw limitRes.error;
        }

        const limit = limitRes.data?.max_calls_per_month || 10;
        setCallsLimit(limit);
      } catch (err) {
        logger.error('Error al cargar uso de IA:', err);
        setError('No se pudo cargar la cuota de IA.');
      } finally {
        setLoading(false);
      }
    };

    fetchAiQuota();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-sm flex items-center justify-center text-center">
        {error}
      </div>
    );
  }

  const percentage = callsLimit > 0 ? Math.min(100, Math.round((callsUsed / callsLimit) * 100)) : 100;
  const isDanger = percentage >= 90 && percentage < 100;
  const isExhausted = percentage >= 100;

  return (
    <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg">
          <Zap className="w-4 h-4 fill-amber-500" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">IA este mes</h3>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={`h-2 transition-all ${
            isExhausted 
              ? '[&>div]:bg-red-500 dark:[&>div]:bg-red-500 bg-red-100 dark:bg-red-950' 
              : isDanger 
                ? '[&>div]:bg-amber-500 dark:[&>div]:bg-amber-500 bg-amber-100 dark:bg-amber-950' 
                : '[&>div]:bg-amber-500'
          }`}
        />
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {callsUsed} / {callsLimit} usos
          </span>
          {isExhausted ? (
            <span className="text-red-600 dark:text-red-400 font-semibold text-xs tracking-wide uppercase">Límite alcanzado</span>
          ) : isDanger ? (
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wide uppercase">Cerca del límite</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 font-medium">{percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiQuotaWidget;
