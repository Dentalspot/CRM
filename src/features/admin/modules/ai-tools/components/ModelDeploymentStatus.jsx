import React from 'react';

/**
 * Status indicator for model deployment.
 */
const ModelDeploymentStatus = () => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-sm">Active</span>
  </div>
);

export default ModelDeploymentStatus;