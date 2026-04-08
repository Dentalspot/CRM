import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, BookOpen, ExternalLink, Loader2, Sparkles, FileText, FlaskConical, Lightbulb, Stethoscope, ShieldCheck, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import EvidenceChat from '@/features/therapist/components/EvidenceChat';

const QUICK_SEARCHES = [
  { label: 'Disfagia infantil', query: 'tratamiento disfagia infantil' },
  { label: 'TEA comunicación', query: 'intervención comunicación TEA' },
  { label: 'Tartamudez', query: 'tratamiento tartamudez niños' },
  { label: 'Apraxia del habla', query: 'apraxia del habla infantil tratamiento' },
  { label: 'Trastorno fonológico', query: 'intervención trastorno fonológico' },
  { label: 'Afasia post-ACV', query: 'rehabilitación afasia accidente cerebrovascular' },
  { label: 'Disfonía', query: 'tratamiento disfonía terapia vocal' },
  { label: 'ADOS-2 validación', query: 'ADOS-2 validación diagnóstico autismo' },
  { label: 'Perfil Sensorial', query: 'perfil sensorial evaluación procesamiento sensorial' },
  { label: 'Lenguaje expresivo', query: 'retraso lenguaje expresivo intervención temprana' },
];

const EvidenceSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-evidence', {
        body: { query: q, max_results: 6, summarize: true },
      });

      if (fnError) throw fnError;
      setResults(data);
    } catch (err) {
      logger.error('Evidence search error:', err);
      setError('Error al buscar evidencia. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <Helmet>
        <title>Evidencia Científica | DentalSpot</title>
        <meta name="description" content="Busca evidencia científica de PubMed para tratamientos dentals." />
      </Helmet>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
          <FlaskConical className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Evidencia Científica</h1>
          <p className="text-muted-foreground">
            Busca artículos de PubMed sobre tratamientos dentals. La IA resume los hallazgos en español.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-blue-100 shadow-md">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ej: tratamiento disfagia infantil, intervención TEA, tartamudez..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-11"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-6 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </form>

          {/* Quick searches */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_SEARCHES.map((qs) => (
              <Badge
                key={qs.query}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => {
                  setQuery(qs.query);
                  handleSearch(qs.query);
                }}
              >
                {qs.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Structured Evidence */}
          {results.structured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hallazgos Principales */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Hallazgos Principales
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {results.total_results} artículo{results.total_results !== 1 ? 's' : ''} de PubMed
                    {results.model !== 'none' && ` · ${results.model}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line text-sm">
                    {results.structured.hallazgos_principales}
                  </div>
                </CardContent>
              </Card>

              {/* Instrumentos y Población */}
              <Card className="border-teal-200 bg-teal-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                    Instrumentos y Población
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{results.structured.instrumentos_poblacion}</p>
                </CardContent>
              </Card>

              {/* Nivel de Evidencia */}
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Nivel de Evidencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{results.structured.nivel_evidencia}</p>
                </CardContent>
              </Card>

              {/* Ideas Prácticas */}
              {results.structured.ideas_practicas?.length > 0 && (
                <Card className="border-violet-200 bg-violet-50/30 md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-violet-600" />
                      Ideas Prácticas para la Sesión
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.structured.ideas_practicas.map((idea, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white rounded-lg border border-violet-100 p-3">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                          <p className="text-sm text-slate-700 flex-1">{idea}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs gap-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                            onClick={() => {
                              window.open(`/dashboard/therapist/template-generator?objetivo=${encodeURIComponent(idea)}`, '_blank');
                            }}
                          >
                            <Wand2 className="h-3 w-3" />
                            Crear Plantilla
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : results.summary ? (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Síntesis de la Evidencia
                </CardTitle>
                <CardDescription>
                  Generada por IA a partir de {results.total_results} artículo{results.total_results !== 1 ? 's' : ''} de PubMed
                  {results.model !== 'none' && ` · Modelo: ${results.model}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
                  {results.summary}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Artículos Encontrados ({results.total_results})
              </CardTitle>
              <CardDescription>
                Búsqueda PubMed: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{results.pubmed_query}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.articles?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No se encontraron artículos. Intenta con otros términos.
                </p>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-4">
                    {results.articles?.map((article, idx) => (
                      <div key={article.url || idx} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-snug mb-1">
                              <span className="text-blue-600 font-bold mr-1.5">[{idx + 1}]</span>
                              {article.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              {article.authors} · <span className="font-medium">{article.journal}</span> ({article.year})
                            </p>
                            {article.abstract && (
                              <p className="text-xs text-slate-600 line-clamp-3">{article.abstract}</p>
                            )}
                          </div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <ExternalLink className="h-3 w-3" />
                              PubMed
                            </Button>
                          </a>
                        </div>
                        {article.doi && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            DOI: <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{article.doi}</a>
                          </p>
                        )}
                        <EvidenceChat
                          articleTitle={article.title}
                          articleContext={`${article.title}. ${article.authors} (${article.year}). ${article.journal}. ${article.abstract || ''}`}
                          evidenceContext={results.structured?.hallazgos_principales || results.summary || ''}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            <FileText className="inline h-3 w-3 mr-1" />
            Los resultados provienen de PubMed (NIH). La síntesis es generada por IA y debe ser validada por el profesional.
            No reemplaza el juicio clínico.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Busca evidencia científica</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Escribe tu consulta clínica y buscaremos artículos relevantes en PubMed.
              La IA generará un resumen en español con las implicaciones clínicas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvidenceSearchPage;
