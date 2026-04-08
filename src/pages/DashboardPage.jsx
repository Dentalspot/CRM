import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, Calendar, Folder, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardPage = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return <p>Cargando...</p>;
    }
    
    return (
        <motion.div 
            className="container mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold">¡Hola, {user.user_metadata?.full_name || 'Usuario'}!</h1>
                <p className="text-muted-foreground">Bienvenido/a de vuelta a tu panel de control.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                 >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center"><LayoutDashboard className="mr-2" /> Panel Principal</CardTitle>
                             <CardDescription>Visualiza tus métricas clave y agenda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild><Link to="/dashboard/therapist">Ir al Panel</Link></Button>
                        </CardContent>
                    </Card>
                </motion.div>

                 <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                 >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center"><User className="mr-2" />Mi Perfil</CardTitle>
                             <CardDescription>Actualiza tu información personal y profesional.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild><Link to="/dashboard/profile">Editar Perfil</Link></Button>
                        </CardContent>
                    </Card>
                </motion.div>
                
                 <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                 >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Calendar className="mr-2" />Mi Agenda</CardTitle>
                             <CardDescription>Gestiona tus citas y disponibilidad.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild><Link to="/dashboard/calendar">Ver Agenda</Link></Button>
                        </CardContent>
                    </Card>
                </motion.div>
                
                {user.role === 'therapist' && (
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center"><Folder className="mr-2" />Mis Pacientes</CardTitle>
                                 <CardDescription>Accede al historial y notas de tus pacientes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild><Link to="/dashboard/patients">Gestionar Pacientes</Link></Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Settings className="mr-2" />Configuración</CardTitle>
                             <CardDescription>Ajusta las preferencias de tu cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild><Link to="/dashboard/settings">Ir a Configuración</Link></Button>
                        </CardContent>
                    </Card>
                </motion.div>

                 <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                 >
                    <Card className="h-full bg-muted/50">
                        <CardHeader>
                            <CardTitle className="flex items-center"><LogOut className="mr-2" />Cerrar Sesión</CardTitle>
                             <CardDescription>Finaliza tu sesión de forma segura.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={logout}>Cerrar Sesión</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DashboardPage;