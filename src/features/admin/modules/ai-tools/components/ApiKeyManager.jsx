import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Management for AI service API keys.
 */
const ApiKeyManager = () => (
  <div className="border p-4 rounded">
    <h3 className="font-bold mb-2">API Keys</h3>
    <Button variant="outline">Rotar Keys</Button>
  </div>
);

export default ApiKeyManager;