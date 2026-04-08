import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, Download, RefreshCw, TrendingUp, Gift, Users } from 'lucide-react';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0, rewarded: 0, totalRewards: 0 });

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_feedback')
      .select('*, profiles:user_id(full_name, email, role)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeedback(data);
      const ratings = data.map(f => f.rating);
      setStats({
        total: data.length,
        avg: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0,
        rewarded: data.filter(f => f.reward_granted).length,
        totalRewards: data.filter(f => f.reward_granted).reduce((sum, f) => sum + (f.reward_amount || 0), 0),
      });
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Email', 'Rating', 'Comentario', 'Recompensa'];
    const rows = feedback.map(f => [
      new Date(f.created_at).toLocaleString('es-CL'),
      f.profiles?.full_name || '—',
      f.profiles?.email || '—',
      f.rating,
      (f.comment || '').replace(/"/g, '""'),
      f.reward_granted ? `$${(f.reward_amount || 0).toLocaleString('es-CL')}` : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: feedback.filter(f => f.rating === r).length,
    pct: feedback.length > 0 ? Math.round((feedback.filter(f => f.rating === r).length / feedback.length) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-teal-600" /> Feedback de Usuarios
          </h1>
          <p className="text-muted-foreground">Opiniones y valoraciones de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFeedback}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={feedback.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Total respuestas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Star className="h-6 w-6 mx-auto text-amber-400 mb-1" />
          <p className="text-2xl font-bold text-amber-600">{stats.avg}</p>
          <p className="text-xs text-gray-500">Rating promedio</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Gift className="h-6 w-6 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-green-600">{stats.rewarded}</p>
          <p className="text-xs text-gray-500">Recompensas entregadas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-purple-600">${stats.totalRewards.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500">Total invertido</p>
        </CardContent></Card>
      </div>

      {/* Rating distribution + feedback list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribución de Ratings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ratingDistribution.map(r => (
              <div key={r.rating} className="flex items-center gap-2">
                <span className="text-sm w-8 flex items-center gap-0.5">
                  {r.rating} <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-amber-400 h-2.5 rounded-full transition-all"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{r.count} ({r.pct}%)</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feedback list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Comentarios Recientes</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10 text-gray-500">Cargando...</div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p>No hay feedback registrado aún</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {feedback.map(f => (
                    <div key={f.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{f.profiles?.full_name || 'Usuario'}</span>
                            <span className="text-xs text-gray-400">{f.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {new Date(f.created_at).toLocaleDateString('es-CL')}
                          </span>
                          {f.reward_granted && (
                            <Badge className="bg-green-100 text-green-700 ml-2 text-[10px]">
                              ${(f.reward_amount || 0).toLocaleString('es-CL')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {f.comment && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">{f.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
