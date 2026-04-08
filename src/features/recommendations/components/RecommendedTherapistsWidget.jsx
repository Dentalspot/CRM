import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Award, CheckCircle2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecommendedTherapistsWidget = ({ therapists }) => {
  if (!therapists || therapists.length === 0) return null;

  // Limit to Top 3
  const topTherapists = therapists.slice(0, 3);

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Award className="h-6 w-6 text-yellow-500" />
        Profesionales Recomendados para ti (Top 3)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topTherapists.map((therapist, index) => (
          <Card key={therapist.id} className={`flex flex-col border-2 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${index === 0 ? 'border-primary/50 shadow-md scale-105 z-10 md:mt-0 mt-0' : 'border-transparent shadow-sm md:mt-4'}`}>
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-bold z-20">
                Mejor Coincidencia
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage src={therapist.photo_url} alt={therapist.name} className="object-cover" />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-lg leading-tight">{therapist.name}</h4>
                    <p className="text-sm text-muted-foreground">{therapist.specialty}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-primary flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" /> Coincidencia
                  </span>
                  <span>{therapist.match_score}%</span>
                </div>
                <Progress value={parseInt(therapist.match_score)} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {therapist.experience_years} años exp.
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {therapist.success_rate}% éxito
                </Badge>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {therapist.bio}
              </p>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {therapist.languages && therapist.languages.map(lang => (
                    <span key={lang} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {lang}
                    </span>
                  ))}
                </div>
                {therapist.availability_status === 'Available' && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Disponible esta semana
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="grid grid-cols-2 gap-3 pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link to={`/dashboard/therapist-profile/${therapist.id}`}>Ver Perfil</Link>
              </Button>
              <Button className="w-full">
                Contactar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M16.096 3.29l1.63 3.66 3.69 1.57-3.66 1.63-1.6 3.69-1.57-3.66-3.69-1.6 3.66-1.6 1.6-3.69zM5.596 12.79l1.63 3.66 3.69 1.57-3.66 1.63-1.6 3.69-1.57-3.66-3.69-1.6 3.66-1.6 1.6-3.69z" />
  </svg>
);

export default RecommendedTherapistsWidget;