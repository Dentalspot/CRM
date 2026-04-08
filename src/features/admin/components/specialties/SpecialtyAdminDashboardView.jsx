import React, { useState, useEffect } from 'react';
import { specialtiesAdminApi } from '@/features/admin/api/specialtiesAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Award, BookOpen } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SpecialtyAdminDashboardView() {
  const [badgeStats, setBadgeStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await specialtiesAdminApi.getBadgeDistribution();
      // Process data for charts
      const processed = data.reduce((acc, curr) => {
        const level = curr.badge_level || 'Sin Nivel';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(processed).map(([name, value]) => ({ name, value }));
      setBadgeStats(chartData);
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Terapeutas Nivel Experto</p>
                <h3 className="text-3xl font-bold">
                  {badgeStats.find(s => s.name === 'Experto')?.value || 0}
                </h3>
              </div>
              <Award className="h-10 w-10 text-indigo-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Total Analizados</p>
                <h3 className="text-3xl font-bold">
                  {badgeStats.reduce((a, b) => a + b.value, 0)}
                </h3>
              </div>
              <Users className="h-10 w-10 text-emerald-200 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Cursos Sugeridos Activos</p>
                <h3 className="text-3xl font-bold">12</h3>
              </div>
              <BookOpen className="h-10 w-10 text-blue-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel (Badge)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={badgeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {badgeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terapeutas por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={badgeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" className="text-slate-600">
          <Download className="mr-2 h-4 w-4" /> Exportar Reporte CSV
        </Button>
      </div>
    </div>
  );
}