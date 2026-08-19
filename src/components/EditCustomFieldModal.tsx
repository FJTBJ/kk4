import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info } from 'lucide-react';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  category: 'vfx' | 'techviz';
}

export default function EditCustomFieldModal({
  isOpen,
  onClose,
  field,
  onSave,
  onDelete
}: {
  isOpen: boolean;
  onClose: () => void;
  field: CustomField | null;
  onSave: (updated: CustomField) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [optionsText, setOptionsText] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setOptionsText((field.options || []).join(', '));
    }
  }, [field, isOpen]);

  if (!isOpen || !field) return null;

  const handleSave = () => {
    if (!label.trim()) {
      alert('请输入字段名称');
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (type === 'select') {
      if (!optionsText.trim()) {
        alert('请为下拉选择输入至少一个选项');
        return;
      }
      parsedOptions = optionsText
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    onSave({
      ...field,
      label: label.trim(),
      type,
      options: parsedOptions
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-[#1c1d24] border border-zinc-800 rounded-lg shadow-2xl w-full max-w-sm p-6 text-gray-100">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 className="text-sm font-bold text-white">编辑自定义字段</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">字段名称</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：数字特效、剪辑备注"
              className="w-full bg-[#0d0e12] border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">字段类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#0d0e12] border border-zinc-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="text">文本 (Text)</option>
              <option value="number">数字 (Number)</option>
              <option value="date">日期 (Date)</option>
              <option value="select">下拉选择 (Dropdown)</option>
            </select>
          </div>

          {type === 'select' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">下拉选项 (逗号分隔)</label>
              <input
                type="text"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="已就绪, 制作中, 需修改"
                className="w-full bg-[#0d0e12] border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[9px] text-zinc-500 mt-1">
                提示：各个选项之间请使用中文或英文逗号分隔
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded text-center text-xs font-semibold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-center text-xs font-bold shadow-md transition-colors"
              >
                保存修改
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm(`确定要删除自定义字段「${field.label}」吗？相关数据将不再显示。`)) {
                  onDelete(field.id);
                  onClose();
                }
              }}
              className="w-full py-2 bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 text-red-400 hover:text-red-300 rounded text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              <span>删除此字段</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
