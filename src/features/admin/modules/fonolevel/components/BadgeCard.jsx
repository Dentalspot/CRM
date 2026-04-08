import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * A card to display a single achievement badge.
 * @param {{badge: {icon: React.ReactNode, name: string, description: string}}} props
 */
const BadgeCard = ({ badge }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
        <p className="font-semibold text-sm">{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
      </CardContent>
    </Card>
  );
};

export default BadgeCard;