import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, CheckCircle, User, PenLine } from 'lucide-react';
import { formatDate } from '@/lib/blogUtils';
import { Link, useNavigate } from 'react-router-dom';

const QuestionCard = ({ question, isAdmin = false }) => {
  const navigate = useNavigate();

  const handleRespondAsArticle = () => {
    // Navigate to blog editor with question context pre-filled
    const params = new URLSearchParams({
      question_id: question.id,
      title: `Respuesta a: ${question.title}`,
      body: question.body || '',
    });
    navigate(`/admin/blog/new?${params.toString()}`);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
              <Link to={isAdmin ? `/admin/qa/${question.id}` : `/qa/${question.id}`}>
                {question.title}
              </Link>
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {question.is_anonymous ? (
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> Anónimo</span>
              ) : (
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {question.author_name || 'Usuario'}</span>
              )}
              <span>•</span>
              <span>{formatDate(question.created_at)}</span>
              {question.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-[10px] h-5">{question.category.name}</Badge>
                </>
              )}
            </div>
          </div>
          {isAdmin && (
            <Badge variant={question.status === 'approved' ? 'default' : 'secondary'}>
              {question.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {question.content}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{question.answers_count || 0} respuestas</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{question.helpful_votes || 0} votos</span>
          </div>
          {question.has_accepted_answer && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Resuelto</span>
            </div>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-primary hover:text-primary"
              onClick={handleRespondAsArticle}
            >
              <PenLine className="w-3.5 h-3.5 mr-1.5" />
              Responder como artículo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;