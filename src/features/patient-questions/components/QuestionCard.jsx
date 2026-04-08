import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, User, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const QuestionCard = ({ question, onAnswer, onDelete }) => {
  const [blogSlug, setBlogSlug] = useState(null);

  useEffect(() => {
    if (question.status === 'answered') {
      supabase
        .from('blog_posts')
        .select('slug, id, status')
        .eq('question_id', question.id)
        .eq('status', 'published')
        .maybeSingle()
        .then(({ data }) => {
          if (data) setBlogSlug(data.slug || data.id);
        });
    }
  }, [question.id, question.status]);

  const dateStr = question.createdAt || question.created_at;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <MessageCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{question.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{question.body}</p>
            </div>
          </div>
          <Badge variant={question.status === 'answered' ? 'default' : 'secondary'}>
            {question.status === 'answered' ? 'Respondida' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{question.patientName || 'Paciente'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{dateStr ? new Date(dateStr).toLocaleDateString('es-CL') : ''}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {question.status === 'answered' && blogSlug && (
            <Button size="sm" variant="default" asChild>
              <Link to={`/blog/${blogSlug}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver respuesta
              </Link>
            </Button>
          )}
          {question.status === 'answered' && !blogSlug && (
            <span className="text-xs text-muted-foreground py-2">Respuesta en preparación...</span>
          )}
          {question.status !== 'answered' && onAnswer && (
            <Button size="sm" onClick={() => onAnswer(question.id)}>
              Responder
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onDelete(question.id)}>
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;