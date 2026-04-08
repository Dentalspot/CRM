import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Eye, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const BlogModerationCard = ({ post, onApprove, onReject }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleReject = () => {
    onReject(post.id, feedback);
    setIsRejecting(false);
    setFeedback('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1">{post.title}</CardTitle>
            <CardDescription>
              Por {post.author?.full_name} • {format(new Date(post.created_at), 'dd/MM/yyyy')}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" title="Editar artículo" asChild>
              <Link to={`/admin/blog/${post.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" title="Ver artículo completo" asChild>
              <Link to={`/admin/blog/${post.id}/view`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {post.description || "Sin descripción corta..."}
        </p>
        
        {isRejecting && (
          <div className="mt-4 space-y-2 animate-in fade-in zoom-in-95">
            <Textarea 
              placeholder="Razón del rechazo (feedback para el autor)..." 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>Cancelar</Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>Confirmar Rechazo</Button>
            </div>
          </div>
        )}
      </CardContent>
      {!isRejecting && (
        <CardFooter className="justify-end gap-2">
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsRejecting(true)}
          >
            <X className="mr-2 h-4 w-4" /> Rechazar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(post.id)}
          >
            <Check className="mr-2 h-4 w-4" /> Aprobar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BlogModerationCard;