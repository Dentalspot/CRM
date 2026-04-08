import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
const MetricCard = ({ title, value }) => (
  <Card>
    <CardHeader><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);
export default MetricCard;