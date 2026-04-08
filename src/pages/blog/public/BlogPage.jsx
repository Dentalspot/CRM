
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logger from '@/lib/utils/logger';
import { blogApi } from '@/features/admin/modules/blog/api/blogApi';

const BlogPostCard = ({ post, delay }) => {
  const dateStr = post.published_at || post.created_at;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('es-CL') : '';
  const authorName = post.author?.full_name || post.author_name || 'Equipo DentalSpot';
  const categoryName = post.categories?.name || post.category?.name || 'Blog';
  const coverUrl = post.cover_url || 'https://images.unsplash.com/photo-1675023112817-52b789fd2ef0';
  const slug = post.slug || post.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card className="flex flex-col h-full overflow-hidden hover:shadow-xl transition-shadow duration-300 glassmorphism">
        <div className="aspect-video overflow-hidden">
          <img className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" alt={post.title} src={coverUrl} />
        </div>
        <CardHeader>
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">{categoryName}</span>
          <CardTitle className="mt-1 text-xl leading-tight">
            <Link to={`/blog/${slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{post.excerpt}</CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center gap-2 border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1 sm:space-y-0">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCircle size={14} />
              <span>{authorName}</span>
            </div>
          </div>
          <Button variant="ghost" asChild className="text-primary hover:text-primary/80 p-0 h-auto self-end sm:self-center">
            <Link to={`/blog/${slug}`}>
              Leer Más <ArrowRight size={16} className="ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await blogApi.fetchPosts({ status: 'published', limit: 12 });
        setPosts(res.data || []);
      } catch (err) {
        logger.error('Error fetching posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Blog DentalSpot
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
          Artículos, noticias y recursos para profesionales de la odontología y la salud.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-64 rounded-lg bg-muted"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">Error al cargar artículos: {error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">No hay artículos publicados aún.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {posts.map((post, index) => (
            <BlogPostCard key={post.id} post={post} delay={index * 0.1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
