import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCheck } from 'lucide-react';

import { useNotifications, useAllNotifications } from '../hooks/useNotifications';
import NotificationItem from '../components/NotificationItem';

/**
 * Página dedicada con TODAS las notificaciones no expiradas.
 * Reusa NotificationItem y aprovecha realtime via useNotifications.
 */
const NotificationsPage = () => {
  const { notifications, loading, refresh } = useAllNotifications();
  const { markAsRead, markAllAsRead, unreadCount } = useNotifications({ limit: 100, toastOnNew: false });

  const handleItemClick = (n) => {
    if (!n.read) markAsRead(n.id);
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    refresh();
  };

  return (
    <>
      <Helmet>
        <title>Notificaciones | DentalSpot</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notificaciones</h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No tienes notificaciones.</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NotificationsPage;
