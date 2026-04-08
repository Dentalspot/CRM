import React from 'react';
import QuestionCard from './QuestionCard';
import { Skeleton } from '@/components/ui/skeleton';

const QuestionList = ({ questions, loading, isAdmin = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No se encontraron preguntas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} isAdmin={isAdmin} />
      ))}
    </div>
  );
};

export default QuestionList;