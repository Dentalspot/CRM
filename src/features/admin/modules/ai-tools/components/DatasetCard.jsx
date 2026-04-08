import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Card representing a dataset file.
 */
const DatasetCard = ({ dataset }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dataset?.name}</CardTitle>
        <CardDescription>{dataset?.size} entries</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default DatasetCard;