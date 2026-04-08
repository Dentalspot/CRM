import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Interactive playground for testing models.
 */
const InferencePlayground = ({ onRun, output }) => {
  return (
    <div className="grid grid-cols-2 gap-4 h-[500px]">
      <div className="flex flex-col gap-2">
        <label>Input</label>
        <Textarea className="flex-1" placeholder="Enter prompt..." />
        <Button onClick={onRun}>Ejecutar</Button>
      </div>
      <div className="flex flex-col gap-2">
        <label>Output</label>
        <div className="flex-1 bg-muted p-4 rounded-md border">{output || 'Waiting...'}</div>
      </div>
    </div>
  );
};

export default InferencePlayground;