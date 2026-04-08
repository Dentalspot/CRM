import React, { useState, useEffect } from 'react';
import { specialtiesAdminApi } from '@/features/admin/api/specialtiesAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, Zap } from 'lucide-react';

export default function KeywordsAdminView() {
  const [keywords, setKeywords] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  
  const [formData, setFormData] = useState({
    keyword: '',
    weight: 1.0,
    specialty_id: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [specs, keys] = await Promise.all([
        specialtiesAdminApi.getAllSpecialties(),
        specialtiesAdminApi.getKeywords()
      ]);
      setSpecialties(specs);
      setKeywords(keys);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fallo al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const filteredKeywords = selectedSpecialty === 'all' 
    ? keywords 
    : keywords.filter(k => k.specialty_id === selectedSpecialty);

  const handleOpenModal = (keyword = null) => {
    if (keyword) {
      setEditingKeyword(keyword);
      setFormData({
        keyword: keyword.keyword,
        weight: keyword.weight,
        specialty_id: keyword.specialty_id
      });
    } else {
      setEditingKeyword(null);
      setFormData({
        keyword: '',
        weight: 1.0,
        specialty_id: selectedSpecialty !== 'all' ? selectedSpecialty : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKeyword) {
        await specialtiesAdminApi.updateKeyword(editingKeyword.id, formData);
        toast({ title: 'Actualizado', description: 'Palabra clave actualizada' });
      } else {
        await specialtiesAdminApi.createKeyword(formData);
        toast({ title: 'Creado', description: 'Palabra clave creada' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta palabra clave?')) return;
    try {
      await specialtiesAdminApi.deleteKeyword(id);
      setKeywords(prev => prev.filter(k => k.id !== id));
      toast({ title: 'Eliminado', description: 'Palabra clave eliminada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Palabras Clave</h2>
          <p className="text-muted-foreground">Configura los términos que activan las sugerencias automáticas.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-slate-900 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nueva Palabra Clave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {specialties.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palabra Clave</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Peso (Weight)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center p-4">Cargando...</TableCell></TableRow>
                  ) : filteredKeywords.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center p-4 text-muted-foreground">No hay palabras clave configuradas.</TableCell></TableRow>
                  ) : (
                    filteredKeywords.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.keyword}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {k.specialties?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${Math.min(k.weight * 20, 100)}%` }} 
                              />
                            </div>
                            <span className="text-xs text-slate-600">{k.weight}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(k)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(k.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKeyword ? 'Editar' : 'Crear'} Palabra Clave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Palabra o Frase</Label>
              <Input 
                value={formData.keyword} 
                onChange={e => setFormData({...formData, keyword: e.target.value})} 
                placeholder="Ej. Trastorno del Espectro Autista"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidad Asociada</Label>
              <Select 
                value={formData.specialty_id} 
                onValueChange={val => setFormData({...formData, specialty_id: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso (Importancia)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0.1" 
                  max="5.0"
                  value={formData.weight} 
                  onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} 
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">Mayor peso = Mayor probabilidad de match</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}