import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LegalPage = () => {
  const { slug } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) setDoc(data);
      setLoading(false);
    };
    if (slug) fetchDoc();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Documento no encontrado</p>
        <Button variant="outline" asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{doc.title} | DentalSpot</title>
        <meta name="description" content={`${doc.title} — Documento legal de DentalSpot`} />
      </Helmet>

      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio</Link>
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
            {doc.effective_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Vigente desde {format(new Date(doc.effective_date), "d 'de' MMMM yyyy", { locale: es })}
              </span>
            )}
            <span>Versión {doc.version}</span>
          </div>

          <div className="prose prose-gray max-w-none">
            {doc.content?.startsWith('<') ? (
              <div dangerouslySetInnerHTML={{ __html: doc.content }} />
            ) : (
              doc.content?.split('\n').map((p, i) => (
                p.trim() ? <p key={i}>{p}</p> : null
              ))
            )}
          </div>

          <div className="mt-12 pt-6 border-t text-sm text-gray-400">
            <p>DentalSpot — Plataforma de Odontología</p>
            {doc.updated_at && (
              <p>Última actualización: {format(new Date(doc.updated_at), "d MMM yyyy", { locale: es })}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalPage;
