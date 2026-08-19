import { useState } from 'react';
import { X, Plus, Info } from 'lucide-react';

export default function ColumnConfigModal({ 
  isOpen, 
  onClose, 
  allColumns, 
  visibleColumnIds, 
  onToggle,
  onSelectAll,
  onAddDescriptionField,
  onAddCustomNormalField
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  allColumns: any[], 
  visibleColumnIds: Set<string>, 
  onToggle: (id: string) => void,
  onSelectAll: (checked: boolean) => void,
  onAddDescriptionField: (name: string) => void,
  onAddCustomNormalField: (label: string, type: 'text' | 'number' | 'date' | 'select', options?: string[]) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<'normal' | 'desc'>('normal');
  const [normalType, setNormalType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [optionsText, setOptionsText] = useState('');

  if (!isOpen) return null;

  if (isAdding) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-gray-800">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">新建自定义字段</h2>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">字段名称</label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="输入名称，如：数字特效、剪辑备注"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">字段类别</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFieldType('normal')}
                  className={`border rounded p-2 text-center transition-all ${
                    fieldType === 'normal'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600 text-xs'
                  }`}
                >
                  <span className="block text-xs">普通字段</span>
                  <span className="block text-[9px] text-gray-400 font-normal mt-0.5">文本、数字、日期、下拉</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFieldType('desc')}
                  className={`border rounded p-2 text-center transition-all ${
                    fieldType === 'desc'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600 text-xs'
                  }`}
                >
                  <span className="block text-xs">描述字段</span>
                  <span className="block text-[9px] text-gray-400 font-normal mt-0.5">批注意见，支持#键入</span>
                </button>
              </div>
            </div>

            {fieldType === 'normal' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">字段类型</label>
                <select
                  value={normalType}
                  onChange={(e) => setNormalType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="text">文本 (Text)</option>
                  <option value="number">数字 (Number)</option>
                  <option value="date">日期 (Date)</option>
                  <option value="select">下拉选择 (Dropdown)</option>
                </select>
              </div>
            )}

            {fieldType === 'normal' && normalType === 'select' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">下拉选项 (逗号分隔)</label>
                <input
                  type="text"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="例如：已就绪, 制作中, 需修改"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[9px] text-gray-400 mt-1">
                  提示：各个选项之间请使用中文或英文逗号分隔
                </p>
              </div>
            )}

            {fieldType === 'desc' && (
              <div className="bg-amber-50 rounded p-2.5 text-[11px] text-amber-800 border border-amber-200 leading-relaxed">
                <p className="font-semibold flex items-center gap-1 mb-0.5">
                  <Info size={12} /> 关于描述字段
                </p>
                <p className="text-gray-600">
                  描述字段为本系统核心的见解批注类字段。创建后，在镜头详情页的批注输入框中直接输入 <strong className="text-amber-700">#</strong> 即可快速激活标签联想关联。
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-1.5 border border-gray-200 hover:bg-gray-50 rounded text-center text-xs font-semibold text-gray-500 transition-colors"
              >
                返回
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!fieldName.trim()) {
                    alert('请输入字段名称');
                    return;
                  }
                  if (fieldType === 'desc') {
                    onAddDescriptionField(fieldName.trim());
                  } else {
                    let parsedOptions: string[] | undefined = undefined;
                    if (normalType === 'select') {
                      if (!optionsText.trim()) {
                        alert('请为下拉选择输入至少一个选项');
                        return;
                      }
                      parsedOptions = optionsText.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                    }
                    onAddCustomNormalField(fieldName.trim(), normalType, parsedOptions);
                  }
                  // Reset and exit
                  setFieldName('');
                  setFieldType('normal');
                  setNormalType('text');
                  setOptionsText('');
                  setIsAdding(false);
                }}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-center text-xs font-bold transition-colors"
              >
                保存创建
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAllSelected = allColumns.every(col => visibleColumnIds.has(col.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-gray-800">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">字段配置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 全选 / 全部选中 区域 */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer text-sm">
            <input 
              type="checkbox" 
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)} 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-semibold text-gray-800 text-xs">全部显示 / 隐藏</span>
          </label>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => onSelectAll(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              全选
            </button>
            <span className="text-gray-200">|</span>
            <button 
              type="button" 
              onClick={() => onSelectAll(false)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              清空
            </button>
          </div>
        </div>

        {/* Column Checkboxes List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {allColumns.map(col => (
            <label key={col.id} className="flex items-center justify-between hover:bg-gray-50 p-1.5 rounded cursor-pointer text-gray-700 text-xs transition-colors">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={visibleColumnIds.has(col.id)} 
                  onChange={() => onToggle(col.id)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-800">{col.label}</span>
              </div>
              {col.isCustomNormal && (
                <span className="text-[9px] bg-sky-50 text-sky-600 font-bold px-1.5 py-0.2 rounded border border-sky-100 uppercase">
                  普通({col.fieldConfig.type === 'select' ? '下拉' : col.fieldConfig.type === 'number' ? '数字' : col.fieldConfig.type === 'date' ? '日期' : '文本'})
                </span>
              )}
              {col.isDynamic && (
                <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.2 rounded border border-amber-100 uppercase">
                  描述批注
                </span>
              )}
            </label>
          ))}
        </div>

        {/* Bottom Action Area with 新建字段 Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded shadow-md transition-colors"
          >
            <Plus size={14} />
            <span>新建字段</span>
          </button>
        </div>
      </div>
    </div>
  );
}
