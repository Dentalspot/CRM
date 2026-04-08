import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Form to add timeline updates to an incident.
 */
const IncidentNoteForm = ({ onSubmit }) => (
  <div>
    <Textarea placeholder="Update incident..." />
    <Button onClick={onSubmit}>Post Update</Button>
  </div>
);
export default IncidentNoteForm;