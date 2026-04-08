import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Display for token consumption and costs.
 */
const TokenUsageStats = ({ stats }) => (
  <div className="grid grid-cols-2 gap-4">
    <Card><CardContent className="pt-6">Total Tokens: {stats?.total_tokens}</CardContent></Card>
    <Card><CardContent className="pt-6">Costo Estimado: ${stats?.cost}</CardContent></Card>
  </div>
);

export default TokenUsageStats;