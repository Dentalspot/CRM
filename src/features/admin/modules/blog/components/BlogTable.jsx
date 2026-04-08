import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, MoreHorizontal, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BlogStatusBadge from './BlogStatusBadge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const BlogTable = ({ posts, isLoading, onDelete, onPublish, canEdit, canDelete }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No hay artículos que coincidan con los filtros.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">Título</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">
                <Link to={`/admin/blog/${post.id}/view`} className="hover:underline">
                  {post.title}
                </Link>
              </TableCell>
              <TableCell>{post.author?.full_name || 'Desconocido'}</TableCell>
              <TableCell>{post.category || 'General'}</TableCell>
              <TableCell>
                <BlogStatusBadge status={post.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(post.created_at), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to={`/admin/blog/${post.id}/view`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver detalles
                      </Link>
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/blog/${post.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {post.status === 'pending_review' && onPublish && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-green-600 focus:text-green-600"
                          onClick={() => onPublish(post)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Publicar
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    {canDelete && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(post)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BlogTable;