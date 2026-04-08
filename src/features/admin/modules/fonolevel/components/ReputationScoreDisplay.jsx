import React from 'react';
import { Progress } from '@/components/ui/progress';

/**
 * Visual component to display a reputation score with a progress bar.
 * @param {{label: string, score: number, maxScore: number}} props
 */
const ReputationScoreDisplay = ({ label, score = 0, maxScore = 100 }) => {
  const percentage = (score / maxScore) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold">{score}</span>
      </div>
      <Progress value={percentage} />
    </div>
  );
};

export default ReputationScoreDisplay;