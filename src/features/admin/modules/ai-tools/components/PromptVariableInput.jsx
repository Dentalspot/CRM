import React from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input field for prompt variables.
 */
const PromptVariableInput = ({ label }) => (
  <div>
    <label className="text-xs font-medium">{label}</label>
    <Input />
  </div>
);

export default PromptVariableInput;