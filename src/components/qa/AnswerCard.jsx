
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ThumbsUp, ShieldCheck } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { formatDate } from '@/lib/blogUtils';
import { sanitizeHTML } from '@/lib/utils/sanitize';

const AnswerCard = ({ answer, isAuthor, onAccept, onVote }) => {
  return (
    <Card className={`border ${answer.is_accepted ? 'border-green-500 bg-green-50/10' : ''}`}>
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
        <div className="flex items-center gap-3">
          <ProfileAvatar 
            profile={answer.therapist}
            src={answer.therapist?.avatar_url} 
            alt={answer.therapist?.full_name} 
            className="h-10 w-10"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{answer.therapist?.full_name}</h4>
              <Badge variant="secondary" className="text-[10px] h-5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Profesional
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(answer.created_at)}</p>
          </div>
        </div>
        {answer.is_accepted && (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" /> Solución Aceptada
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHTML(answer.content) }} />
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onVote(answer.id)} className="text-muted-foreground">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Útil ({answer.helpful_votes})
            </Button>
          </div>
          
          {isAuthor && !answer.is_accepted && (
            <Button variant="outline" size="sm" onClick={() => onAccept(answer.id)} className="text-green-600 border-green-200 hover:bg-green-50">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como solución
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerCard;
