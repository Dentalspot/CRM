import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const NotificationBell = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-muted/20">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar todo leído
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 text-left hover:bg-accent/50 transition-colors",
                    !notif.read && "bg-accent/5"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn("text-sm font-medium", !notif.read && "text-primary")}>
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;