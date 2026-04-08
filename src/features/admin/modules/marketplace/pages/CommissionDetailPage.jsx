import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, DollarSign, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/adminUtils';

const CommissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setTransaction(data);
      } catch (err) {
        setError(err.message || 'Error al cargar la transaccion');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/marketplace/commissions')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a comisiones
        </Button>
        <Card>
          <CardContent className="text-center py-16">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">{error || 'Transaccion no encontrada'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCredit = transaction.type === 'credit';

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/marketplace/commissions')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a comisiones
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Detalle de Transaccion</h1>
          <p className="text-muted-foreground text-sm">ID: {transaction.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacion General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descripcion</p>
              <p className="font-medium">{transaction.description || '—'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo</p>
              <Badge variant={isCredit ? 'default' : 'secondary'}>
                {isCredit ? 'Ingreso (credit)' : 'Egreso (debit)'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Monto</p>
              <p className={`text-xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                {isCredit ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo de Referencia</p>
              <Badge variant="outline">{transaction.reference_type || '—'}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado</p>
              <Badge variant="outline">{transaction.status || 'completed'}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Fecha de Creacion</p>
              <p className="font-medium">
                {new Date(transaction.created_at).toLocaleString('es-CL', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          {transaction.reference_id && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Referencia</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">{transaction.reference_id}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDetailPage;
