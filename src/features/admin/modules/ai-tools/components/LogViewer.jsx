import React from 'react';

/**
 * Component to view raw logs.
 */
const LogViewer = ({ logs }) => (
  <div className="bg-black text-green-400 p-4 font-mono text-xs rounded-md h-[300px] overflow-auto">
    {logs?.map((l, i) => <div key={i}>{l}</div>) || 'No logs'}
  </div>
);

export default LogViewer;