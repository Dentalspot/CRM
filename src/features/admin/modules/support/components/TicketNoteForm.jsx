import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Form to add internal notes to a ticket.
 */
const TicketNoteForm = ({ onSubmit }) => (
  <div>
    <Textarea placeholder="Add note..." />
    <Button onClick={onSubmit}>Add</Button>
  </div>
);
export default TicketNoteForm;