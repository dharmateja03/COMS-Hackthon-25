import React, { useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { MaterialListItem } from '../components/MaterialListItem';
interface Material {
  id: string;
  name: string;
  confidence: 'low' | 'medium' | 'high';
  selected: boolean;
}
const initialMaterials: Material[] = [{
  id: '1',
  name: 'lecture-1.pdf',
  confidence: 'high',
  selected: false
}, {
  id: '2',
  name: 'notes.txt',
  confidence: 'medium',
  selected: false
}, {
  id: '3',
  name: 'chapter-3-summary.pdf',
  confidence: 'low',
  selected: false
}, {
  id: '4',
  name: 'study-guide.docx',
  confidence: 'high',
  selected: false
}, {
  id: '5',
  name: 'practice-problems.pdf',
  confidence: 'medium',
  selected: false
}, {
  id: '6',
  name: 'lecture-2-transcript.txt',
  confidence: 'low',
  selected: false
}];
export function TestYourSkillsPage() {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const handleToggleMaterial = (id: string) => {
    setMaterials(prev => prev.map(material => material.id === id ? {
      ...material,
      selected: !material.selected
    } : material));
  };
  const selectedCount = materials.filter(m => m.selected).length;
  return <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-6 group" aria-label="Back to Course">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Course</span>
          </button>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-fuchsia-500 bg-clip-text text-transparent mb-2">
            Test Your Skills
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button disabled={selectedCount === 0} className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-teal-500 to-fuchsia-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.4),0_0_20px_rgba(217,70,239,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
            Start Quiz {selectedCount > 0 && `(${selectedCount})`}
          </button>

          <button disabled={selectedCount === 0} className="px-6 py-3 rounded-lg font-semibold bg-[#1a1a2e] border border-gray-700 hover:border-teal-400 hover:shadow-[0_0_12px_rgba(20,184,166,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:shadow-none">
            Create Flash Cards {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>

        {/* Material List */}
        <div className="space-y-3">
          {materials.map(material => <MaterialListItem key={material.id} id={material.id} name={material.name} confidence={material.confidence} selected={material.selected} onToggle={handleToggleMaterial} />)}
        </div>
      </div>
    </div>;
}