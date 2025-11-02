import React from 'react';
import { BookOpenIcon, CalendarIcon } from 'lucide-react';

interface CourseCardProps {
  title: string;
  description: string;
  dateCreated: string;
}

export function CourseCard({
  title,
  description,
  dateCreated
}: CourseCardProps) {
  return <div className="bg-dark-card border border-gray-700 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-teal-glow hover:shadow-glow-mixed hover:-translate-y-1 group">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gradient-to-r group-hover:from-teal-glow group-hover:to-magenta-glow transition-all duration-300">
          <BookOpenIcon className="w-6 h-6 text-teal-glow group-hover:text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:gradient-text transition-all duration-300">
            {title}
          </h3>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CalendarIcon className="w-4 h-4" />
        <span>Created {dateCreated}</span>
      </div>
    </div>;
}
