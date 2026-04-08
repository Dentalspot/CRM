import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const FAKE_CATEGORIES = [
  { id: 1, name: 'Desarrollo Infantil', slug: 'desarrollo-infantil', count: 12 },
  { id: 2, name: 'Adultos Mayor', slug: 'adultos-mayor', count: 5 },
  { id: 3, name: 'Voz y Habla', slug: 'voz-habla', count: 8 },
];

const BlogCategoriesPage = () => {
  return (
<div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categorías Existentes</h2>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nueva Categoría</Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Artículos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FAKE_CATEGORIES.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell className="text-center">{cat.count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
    </div>
  );
};

export default BlogCategoriesPage;