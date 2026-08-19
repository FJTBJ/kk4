import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function DescriptionManagerModal({ 
  isOpen, 
  onClose, 
  descriptionTypes, 
  onAdd, 
  onRemove 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  descriptionTypes: string[], 
  onAdd: (type: string) => void, 
  onRemove: (type: string) => void 
}) {
  const [newType, setNewType] = useState('');
  const handleAdd = () => {
    console.log('handleAdd called, newType:', newType);
    if (newType.trim()) {
      console.log('Adding type:', newType.trim());
      onAdd(newType.trim());
      setNewType('');
    } else {
      console.log('Type is empty or whitespace');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">镜头描述分类</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input 
            value={newType} 
            onChange={(e) => setNewType(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
            placeholder="新分类名称"
            className="border rounded px-2 py-1 flex-1"
          />
          <button onClick={(e) => { e.preventDefault(); handleAdd(); }} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><Plus size={16}/></button>
        </div>
        <div className="space-y-2">
          {descriptionTypes.map(type => (
            <div key={type} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span>{type}</span>
              <button onClick={() => onRemove(type)} className="text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
