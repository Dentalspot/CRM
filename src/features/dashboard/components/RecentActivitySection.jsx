import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BlogQuestionsWidget from '@/features/therapist/components/BlogQuestionsWidget';
import MotivationalPhrase from '@/components/MotivationalPhrase';

const RecentActivitySection = ({ recentSessions = [] }) => {
  return (
    <div className="space-y-6">
      {/* Inspirational Widget */}
      <MotivationalPhrase type="therapist" />

      {/* Activity Feed */}
      <Card className="h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[320px] px-6">
            <div className="space-y-6 pb-6">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {/* Connector Line */}
                    {i !== recentSessions.length - 1 && (
                      <div className="absolute left-[9px] top-7 bottom-[-24px] w-[2px] bg-muted" />
                    )}
                    
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-green-500 bg-background relative z-10" />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Sesión completada con <span className="text-primary">{session.patient_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.completed_at || session.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                      {session.summary && (
                        <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2 bg-muted/30 p-2 rounded-md">
                          "{session.summary}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                  <p>No hay actividad reciente registrada.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Blog & Q&A Stats */}
      <BlogQuestionsWidget />
    </div>
  );
};

export default RecentActivitySection;