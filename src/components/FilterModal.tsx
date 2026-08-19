import { useState } from 'react';
import { Filter, X, Plus } from 'lucide-react';

export default function FilterModal({ isOpen, onClose, onApply }: { isOpen: boolean, onClose: () => void, onApply: (condition: any) => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">筛选</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
            ✨ 告诉 AI 你想看到什么。例如：指派给我的任务
        </div>
        <div className="space-y-4">
            <div className="flex gap-2 items-center text-sm">
                <span>当</span>
                <select className="border rounded px-2 py-1">
                    <option>镜头名称</option>
                    <option>状态</option>
                    <option>等级</option>
                    <option>类型</option>
                </select>
                <select className="border rounded px-2 py-1">
                    <option>包含</option>
                    <option>等于</option>
                </select>
                <input className="border rounded px-2 py-1 flex-1" placeholder="输入值..." />
            </div>
            <button className="text-blue-600 flex items-center gap-1 text-sm"><Plus size={16}/> 添加条件</button>
        </div>
      </div>
    </div>
  );
}
