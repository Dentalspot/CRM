import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText,
  CheckCircle2,
  DollarSign,
  Award,
  Bell,
} from 'lucide-react';

const TYPE_ICONS = {
  budget_sent: FileText,
  budget_accepted: CheckCircle2,
  budget_payment_registered: DollarSign,
  budget_completed: Award,
  appointment: Bell,
  reminder: Bell,
  message: Bell,
  system: Bell,
  payment: DollarSign,
  document: FileText,
};

const NotificationItem = ({ notification, onClick }) => {
  const navigate = useNavigate();
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const isUnread = !notification.read;

  const handleClick = () => {
    if (onClick) onClick(notification);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex gap-3 items-start ${
        isUnread ? 'bg-primary/5' : ''
      }`}
    >
      <div className={`shrink-0 rounded-full p-2 ${isUnread ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${isUnread ? 'font-semibold' : 'font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
      {isUnread && (
        <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" aria-label="No leída" />
      )}
    </button>
  );
};

export default NotificationItem;
