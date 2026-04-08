import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Summary card for an AI model.
 */
const AiModelCard = ({ model }) => (
  <Card>
    <CardHeader>
      <CardTitle>{model?.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{model?.description}</p>
    </CardContent>
  </Card>
);

export default AiModelCard;