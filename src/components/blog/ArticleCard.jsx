import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/blogUtils';

const ArticleCard = ({ article, isAdmin = false }) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden group">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {article.featured_image_url ? (
          <img 
            src={article.featured_image_url} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            Sin imagen
          </div>
        )}
        {article.category && (
          <Badge className="absolute top-3 left-3 bg-white/90 text-foreground hover:bg-white">
            {article.category.name}
          </Badge>
        )}
        {isAdmin && (
          <Badge variant={article.status === 'published' ? 'success' : 'secondary'} className="absolute top-3 right-3">
            {article.status === 'published' ? 'Publicado' : 'Borrador'}
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2 space-y-2">
        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          <Link to={isAdmin ? `/admin/blog/${article.id}` : `/blog/${article.slug}`}>
            {article.title}
          </Link>
        </h3>
        <div className="flex items-center text-xs text-muted-foreground gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(article.published_at || article.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.read_time || 5} min
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.excerpt}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t bg-muted/5 mt-auto">
        {isAdmin ? (
          <div className="flex justify-between items-center w-full pt-3">
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <Eye className="w-3 h-3" />
              {article.views_count} vistas
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/admin/blog/edit/${article.id}`}>Editar</Link>
            </Button>
          </div>
        ) : (
          <Button variant="link" className="px-0 pt-3 text-primary group-hover:underline" asChild>
            <Link to={`/blog/${article.slug}`}>
              Leer artículo <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;