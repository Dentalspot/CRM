import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Detail card for a single ticket.
 */
const TicketCard = ({ ticket }) => (
  <Card><CardContent>Ticket Info: {ticket?.subject}</CardContent></Card>
);
export default TicketCard;