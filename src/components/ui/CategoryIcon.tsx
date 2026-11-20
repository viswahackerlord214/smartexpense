import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className = 'w-5 h-5', color }: CategoryIconProps) {
  // Lucide icons lookup
  const IconComponent = (Icons as any)[name] || Icons.Tag;
  return <IconComponent className={className} style={{ color }} />;
}

