import React from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
interface MaterialListItemProps {
  id: string;
  name: string;
  confidence: 'low' | 'medium' | 'high';
  selected: boolean;
  onToggle: (id: string) => void;
}
export function MaterialListItem({
  id,
  name,
  confidence,
  selected,
  onToggle
}: MaterialListItemProps) {
  return <div className="flex items-center gap-4 p-4 bg-[#1a1a2e] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
      <input type="checkbox" id={id} checked={selected} onChange={() => onToggle(id)} className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer" aria-label={`Select ${name}`} />

      <label htmlFor={id} className="flex-1 text-white font-medium cursor-pointer">
        {name}
      </label>

      <ConfidenceBadge level={confidence} />
    </div>;
}