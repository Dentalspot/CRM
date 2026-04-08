import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * Card summarizing an error group.
 */
const ErrorCard = ({ error }) => <Card>Error: {error?.message}</Card>;
export default ErrorCard;