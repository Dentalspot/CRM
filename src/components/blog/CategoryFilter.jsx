import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="rounded-full"
      >
        Todos
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedCategory === cat.slug ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(cat.slug)}
          className="rounded-full"
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;