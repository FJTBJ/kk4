/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FocusEvent } from 'react';
import { generateMockData } from './data';
import { 
  LayoutGrid, 
  TableProperties, 
  Filter, 
  Plus, 
  Download, 
  Edit3, 
  Check, 
  X, 
  Play, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  ArrowUpDown,
  Search,
  CheckSquare,
  Layers,
  Eye
} from 'lucide-react';
import ShotModal from './components/ShotModal';
import FilterModal from './components/FilterModal';
import ColumnConfigModal from './components/ColumnConfigModal';
import DescriptionManagerModal from './components/DescriptionManagerModal';
import EditCustomFieldModal from './components/EditCustomFieldModal';
import EngineeringDrawingModal from './components/EngineeringDrawingModal';
import { BaseShot, ProductionData, DescriptionEntry, DrawingVersion } from './types';

export default function App() {
  const [view, setView] = useState<'table' | 'swimlane'>('table');
  const [activeTab, setActiveTab] = useState<'vfx' | 'techviz'>('vfx'); // Default to vfx as requested
  
  // Real writeable state for shots and comments
  const [dataState, setDataState] = useState(() => generateMockData(60));
  const shots = dataState.shots;
  const descriptions = dataState.descriptions;

  // Track selected row ids
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set(['techviz_shot_3'])); // pre-select Row 4 (index 3: e01_s001_c056) to match the mockup's selected state!
  const [selectedShot, setSelectedShot] = useState<(BaseShot & { production: ProductionData }) | null>(null);
  const [drawingModalShot, setDrawingModalShot] = useState<BaseShot | null>(null);
  
  // Modal toggle states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isDescManagerOpen, setIsDescManagerOpen] = useState(false);
  const [isEditCustomFieldOpen, setIsEditCustomFieldOpen] = useState(false);

  // Edit Custom Field Modal State
  const [editingCustomField, setEditingCustomField] = useState<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    category: 'vfx' | 'techviz';
  } | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [levelFilter, setLevelFilter] = useState('全部');

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{
    shotId: string;
    field: string;
    text: string;
    days?: number;
  } | null>(null);

  // 1. VFX Columns & Customization
  const [vfxDescriptionTypes, setVfxDescriptionTypes] = useState<string[]>(['数字场景', '数字盗掘', '动画', '环境特效', '角色特效', '灯光氛围', '灯光渲染', 'ai制作', '合成', '备注']);
  const [vfxVisibleColumnIds, setVfxVisibleColumnIds] = useState<Set<string>>(new Set([
    'name', 'status', 'level', 'techvizDrawing', 'description', 'sceneName', 'assignedUserId',
    'custom_vendor', 'custom_renderTime', 'custom_onlineDate', 'custom_compArtist'
  ]));

  // 2. Techviz Columns & Customization (Full 15-column matching screenshot)
  const [techvizDescriptionTypes, setTechvizDescriptionTypes] = useState<string[]>(['拍摄方式', '数字人', 'Techviz备注', '视效备注', '备注']);
  const [techvizVisibleColumnIds, setTechvizVisibleColumnIds] = useState<Set<string>>(new Set([
    'index', 
    'name', 
    'sceneName', 
    'timelineName', 
    'startThumbnailUrl', 
    'videoUrl', 
    'endThumbnailUrl', 
    'involvedArea', 
    'techvizDrawing', 
    'techvizDrawingNo', 
    'description', 
    ...['拍摄方式', '数字人', 'Techviz备注', '视效备注', '备注'].map(type => `desc_${type}`),
    'custom_cameraModel', 'custom_hasMockup', 'custom_rehearsalHours', 'custom_shootDate',
    'progress'
  ]));

  // Custom Normal Fields state (Allows users to add standard custom fields of various datatypes)
  const [customNormalFields, setCustomNormalFields] = useState<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    category: 'vfx' | 'techviz';
  }[]>([
    // VFX Custom Fields
    { id: 'vendor', label: '制作公司', type: 'select', options: ['维塔数码 (Weta)', '光影魔幻 (ILM)', '原力动画', '数字王国 (DD)', 'BASE FX'], category: 'vfx' },
    { id: 'renderTime', label: '预估渲染时间(小时)', type: 'number', category: 'vfx' },
    { id: 'onlineDate', label: '素材到位日期', type: 'date', category: 'vfx' },
    { id: 'compArtist', label: '合成负责人', type: 'text', category: 'vfx' },

    // Techviz Custom Fields
    { id: 'cameraModel', label: '参考摄影机', type: 'select', options: ['ARRI Alexa LF', 'RED V-RAPTOR', 'Sony Venice 2', 'RED KOMODO'], category: 'techviz' },
    { id: 'hasMockup', label: '是否包含替身', type: 'select', options: ['是', '否'], category: 'techviz' },
    { id: 'rehearsalHours', label: '预演制作工时(h)', type: 'number', category: 'techviz' },
    { id: 'shootDate', label: '预计实拍日期', type: 'date', category: 'techviz' }
  ]);

  // Dynamically resolve description types based on tab
  const descriptionTypes = activeTab === 'vfx' ? vfxDescriptionTypes : techvizDescriptionTypes;
  const setDescriptionTypes = (val: string[] | ((prev: string[]) => string[])) => {
    if (activeTab === 'vfx') {
      setVfxDescriptionTypes(val);
    } else {
      setTechvizDescriptionTypes(val);
    }
  };

  const visibleColumnIds = activeTab === 'vfx' ? vfxVisibleColumnIds : techvizVisibleColumnIds;
  const setVisibleColumnIds = (val: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const setter = activeTab === 'vfx' ? setVfxVisibleColumnIds : setTechvizVisibleColumnIds;
    setter(val);
  };

  const toggleColumn = (id: string) => {
    const next = new Set<string>(visibleColumnIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleColumnIds(next);
  };

  const handleSelectAllColumns = (checked: boolean) => {
    if (checked) {
      setVisibleColumnIds(new Set<string>(allColumns.map(col => col.id)));
    } else {
      setVisibleColumnIds(new Set<string>());
    }
  };

  const addDescriptionType = (type: string) => {
    if (activeTab === 'vfx') {
      if (type && !vfxDescriptionTypes.includes(type)) {
        setVfxDescriptionTypes([...vfxDescriptionTypes, type]);
      }
    } else {
      if (type && !techvizDescriptionTypes.includes(type)) {
        setTechvizDescriptionTypes([...techvizDescriptionTypes, type]);
      }
    }
  };

  const removeDescriptionType = (type: string) => {
    if (activeTab === 'vfx') {
      setVfxDescriptionTypes(vfxDescriptionTypes.filter(t => t !== type));
    } else {
      setTechvizDescriptionTypes(techvizDescriptionTypes.filter(t => t !== type));
    }
  };

  const handleAddDescriptionField = (name: string) => {
    addDescriptionType(name);
    setVisibleColumnIds(prev => {
      const next = new Set(prev);
      next.add(`desc_${name}`);
      return next;
    });
  };

  const handleAddCustomNormalField = (label: string, type: 'text' | 'number' | 'date' | 'select', options?: string[]) => {
    const id = `custom_${Date.now()}`;
    const newField = {
      id,
      label,
      type,
      options,
      category: activeTab
    };
    setCustomNormalFields(prev => [...prev, newField]);
    setVisibleColumnIds(prev => {
      const next = new Set(prev);
      next.add(`custom_${id}`);
      return next;
    });
  };

  const handleSaveCustomField = (updatedField: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    category: 'vfx' | 'techviz';
  }) => {
    setCustomNormalFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
  };

  const handleDeleteCustomField = (fieldId: string) => {
    setCustomNormalFields(prev => prev.filter(f => f.id !== fieldId));
    setVisibleColumnIds(prev => {
      const next = new Set(prev);
      next.delete(`custom_${fieldId}`);
      return next;
    });
  };

  // Columns definition based on active tab
  const allColumns = useMemo(() => {
    const vfxCustomNormalFields = customNormalFields.filter(f => f.category === 'vfx');
    const techvizCustomNormalFields = customNormalFields.filter(f => f.category === 'techviz');

    if (activeTab === 'techviz') {
      return [
        { id: 'index', label: '序号' },
        { id: 'name', label: '制作镜名(Code)' },
        { id: 'sceneName', label: '场景全称' },
        { id: 'timelineName', label: '场景时间线名称' },
        { id: 'startThumbnailUrl', label: '镜头起幅' },
        { id: 'videoUrl', label: '镜视频' },
        { id: 'endThumbnailUrl', label: '镜头落幅' },
        { id: 'involvedArea', label: '涉及区域' },
        { id: 'techvizDrawing', label: '工程图' },
        { id: 'techvizDrawingNo', label: '工程图编号' },
        { id: 'description', label: '镜头描述' },
        ...techvizDescriptionTypes.map(type => ({ id: `desc_${type}`, label: type, isDynamic: true, type })),
        ...techvizCustomNormalFields.map(field => ({ id: `custom_${field.id}`, label: field.label, isCustomNormal: true, fieldConfig: field })),
        { id: 'progress', label: '进度' },
      ];
    } else {
      return [
        { id: 'thumbnailUrl', label: '缩略图' },
        { id: 'name', label: '镜头名称' },
        { id: 'status', label: '状态' },
        { id: 'level', label: '等级' },
        { id: 'techvizDrawing', label: '工程图' },
        { id: 'description', label: '镜头描述' },
        ...vfxDescriptionTypes.map(type => ({ id: `desc_${type}`, label: type, isDynamic: true, type })),
        ...vfxCustomNormalFields.map(field => ({ id: `custom_${field.id}`, label: field.label, isCustomNormal: true, fieldConfig: field })),
        { id: 'sceneName', label: '场景' },
        { id: 'clipName', label: 'Clip' },
        { id: 'frameRate', label: '帧率' },
        { id: 'frameCount', label: '帧数' },
        { id: 'assignedUserId', label: '负责人' },
        { id: 'deadline', label: '截止日期' },
      ];
    }
  }, [activeTab, vfxDescriptionTypes, techvizDescriptionTypes, customNormalFields]);

  // Create quick lookup for visible dynamic columns
  const visibleDynamicTypes = useMemo(() => {
    return allColumns
      .filter(c => c.isDynamic && visibleColumnIds.has(c.id))
      .map(c => c.type);
  }, [allColumns, visibleColumnIds]);

  // Filter shots based on active category, search and custom filters
  const filteredShots = useMemo(() => {
    return shots.filter(shot => {
      if (shot.category !== activeTab) return false;

      const matchesSearch = shot.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === '全部' || shot.production.type === typeFilter;
      const matchesStatus = statusFilter === '全部' || shot.production.status === statusFilter;
      const matchesLevel = levelFilter === '全部' || shot.production.level === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel && matchesType;
    });
  }, [shots, activeTab, searchQuery, statusFilter, levelFilter, typeFilter]);

  // Handle drawings and version updates
  const handleUpdateDrawings = (shotId: string, drawings: DrawingVersion[], selectedVersion?: string) => {
    setDataState(prev => {
      const nextShots = prev.shots.map(s => {
        if (s.id === shotId) {
          const activeVer = selectedVersion || s.selectedDrawingVersion || drawings[drawings.length - 1]?.version;
          const currentVer = drawings.find(d => d.version === activeVer) || drawings[0];
          return {
            ...s,
            engineeringDrawings: drawings,
            selectedDrawingVersion: activeVer,
            techvizDrawingUrl: currentVer?.images?.[0]?.url || s.techvizDrawingUrl
          };
        }
        return s;
      });
      return { ...prev, shots: nextShots };
    });

    setDrawingModalShot(prev => {
      if (!prev || prev.id !== shotId) return prev;
      const activeVer = selectedVersion || prev.selectedDrawingVersion || drawings[drawings.length - 1]?.version;
      const currentVer = drawings.find(d => d.version === activeVer) || drawings[0];
      return {
        ...prev,
        engineeringDrawings: drawings,
        selectedDrawingVersion: activeVer,
        techvizDrawingUrl: currentVer?.images?.[0]?.url || prev.techvizDrawingUrl
      };
    });
  };

  // Handle cell updates (inline edit)
  const updateShotField = (shotId: string, field: string, value: any, daysField?: string, daysValue?: number) => {
    setDataState(prev => {
      const nextShots = prev.shots.map(s => {
        if (s.id === shotId) {
          let updated = { ...s };
          if (field.startsWith('production.')) {
            const subField = field.split('.')[1];
            updated.production = {
              ...updated.production,
              [subField]: value
            };
          } else {
            updated = { ...updated, [field]: value };
          }
          if (daysField && daysValue !== undefined) {
            (updated as any)[daysField] = daysValue;
          }
          return updated;
        }
        return s;
      });
      return { ...prev, shots: nextShots };
    });
  };

  const handleAddDescription = (shotId: string, type: string, content: string, imageUrl?: string, author?: string) => {
    setDataState(prev => {
      const newDesc: DescriptionEntry = {
        id: `desc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        shotId,
        type,
        content,
        isResolved: false,
        createdAt: new Date().toISOString(),
        imageUrl,
        author: author || '视效总监'
      };
      return {
        ...prev,
        descriptions: [...prev.descriptions, newDesc]
      };
    });
  };

  const handleRemoveDescription = (descId: string) => {
    setDataState(prev => ({
      ...prev,
      descriptions: prev.descriptions.filter(d => d.id !== descId)
    }));
  };

  const handleToggleResolveDescription = (descId: string) => {
    setDataState(prev => ({
      ...prev,
      descriptions: prev.descriptions.map(d => 
        d.id === descId ? { ...d, isResolved: !d.isResolved } : d
      )
    }));
  };

  const startInlineEdit = (shotId: string, field: string, initialText: string, initialDays?: number) => {
    setEditingCell({
      shotId,
      field,
      text: initialText,
      days: initialDays
    });
  };

  const saveInlineEdit = () => {
    if (!editingCell) return;
    const { shotId, field, text, days } = editingCell;
    if (field === 'digitalHuman') {
      updateShotField(shotId, 'digitalHuman', text, 'digitalHumanDays', days);
    } else if (field === 'techvizNotes') {
      updateShotField(shotId, 'techvizNotes', text, 'techvizNotesDays', days);
    } else if (field === 'vfxNotes') {
      updateShotField(shotId, 'vfxNotes', text, 'vfxNotesDays', days);
    } else {
      updateShotField(shotId, field, text);
    }
    setEditingCell(null);
  };

  const handleBlurContainer = (e: FocusEvent<any>) => {
    const currentTarget = e.currentTarget;
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        saveInlineEdit();
      }
    }, 80);
  };

  const toggleShotSelection = (id: string) => {
    const next = new Set(selectedShotIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedShotIds(next);
  };

  const toggleAllShots = () => {
    if (selectedShotIds.size === filteredShots.length && filteredShots.length > 0) {
      setSelectedShotIds(new Set<string>());
    } else {
      setSelectedShotIds(new Set<string>(filteredShots.map(s => s.id)));
    }
  };

  // Mock Export function
  const handleExport = () => {
    alert(`成功导出 ${filteredShots.length} 条 ${activeTab === 'vfx' ? '视效' : 'Techviz'} 镜头清单！`);
  };

  return (
    <div className="min-h-screen bg-[#111216] text-[#c5c6ca] flex flex-col font-sans select-none antialiased">
      
      {/* 1. Main Navigation Header (Top Menu) */}
      <header className="bg-[#18191f] border-b border-[#282a36] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-8 flex-wrap">
          {/* Brand/System Logo */}
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-white tracking-widest text-sm bg-gradient-to-r from-orange-500 to-amber-600 px-3 py-1.5 rounded-md shadow-sm">
              KMOKE VFX
            </span>
            <span className="text-[#3b3e4f]">|</span>
            <span className="text-xs text-zinc-400 font-semibold tracking-wider">镜清单管理系统</span>
          </div>
          
          {/* Main Visual Category Tabs */}
          <nav className="flex bg-[#0f1013] p-1 rounded-lg border border-[#282a36]">
            <button 
              onClick={() => {
                setActiveTab('vfx');
                setSelectedShotIds(new Set<string>());
              }}
              className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'vfx'
                  ? 'bg-[#2a2c35] text-amber-500 shadow-sm border border-[#3b3d4a]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>视效镜清单</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'vfx' ? 'bg-amber-500/15 text-amber-500' : 'bg-[#18191f] text-zinc-600'}`}>
                {shots.filter(s => s.category === 'vfx').length}
              </span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('techviz');
                setSelectedShotIds(new Set<string>());
              }}
              className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'techviz'
                  ? 'bg-[#2a2c35] text-amber-500 shadow-sm border border-[#3b3d4a]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>Techviz 镜清单</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'techviz' ? 'bg-amber-500/15 text-amber-500' : 'bg-[#18191f] text-zinc-600'}`}>
                {shots.filter(s => s.category === 'techviz').length}
              </span>
            </button>
          </nav>
        </div>
        
        {/* View Toggle Controller */}
        <div className="flex items-center gap-1.5 bg-[#0f1013] p-1 rounded-lg border border-[#282a36]">
          <button 
            onClick={() => setView('table')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${view === 'table' ? 'bg-[#2a2c35] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            <TableProperties size={14} /> 表格
          </button>
          <button 
            onClick={() => setView('swimlane')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${view === 'swimlane' ? 'bg-[#2a2c35] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            <LayoutGrid size={14} /> 泳道
          </button>
        </div>
      </header>

      {/* 2. Secondary Interactive Action Toolbar */}
      <div className="bg-[#14151b] border-b border-[#22242e] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap items-center">
          
          {/* Quick Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="搜索镜名..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="bg-[#0c0d10] border border-[#2c2f3c] text-xs rounded-md pl-9 pr-4 py-2 w-60 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors" 
            />
          </div>

          {/* Action Modals Toggles */}
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-1.5 border border-[#2c2f3c] bg-[#1a1b23] hover:bg-[#252732] rounded-md px-3.5 py-2 text-xs font-semibold text-zinc-300 cursor-pointer transition-colors">
            <Filter size={13} /> 筛选
          </button>
          
          <button 
            onClick={() => setIsDescManagerOpen(true)}
            className="text-xs border border-[#2c2f3c] bg-[#1a1b23] hover:bg-[#252732] rounded-md px-3.5 py-2 font-semibold text-zinc-300 cursor-pointer transition-colors"
          >
            描述类型
          </button>

          <button 
            onClick={() => setIsColumnConfigOpen(true)}
            className="text-xs border border-[#2c2f3c] bg-[#1a1b23] hover:bg-[#252732] rounded-md px-3.5 py-2 font-semibold text-zinc-300 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Settings size={13} /> 字段配置
          </button>
        </div>

        {/* Export / Sync Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Download size={13} /> 导出
          </button>
        </div>
      </div>

      {/* 3. Main Data Content Area */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        {view === 'table' ? (
          <div className="bg-[#18191f] rounded-xl shadow-2xl border border-[#282a36] flex-1 flex flex-col overflow-hidden">
            
            {/* Table Header Details */}
            <div className="px-6 py-3.5 border-b border-[#282a36] bg-[#1d1f27] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {activeTab === 'vfx' ? '视效 (VFX)' : 'Techviz'} 镜清单列表
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                符合条件: {filteredShots.length} / {shots.filter(s => s.category === activeTab).length}
              </span>
            </div>
            
            {/* Responsive Horizontal Scrollable Grid */}
            <div className="overflow-x-auto overflow-y-auto flex-1 bg-[#121318]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#18191f] text-zinc-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-[#282a36]">
                  <tr>
                    {/* Multiselect Column */}
                    <th className="px-4 py-3.5 w-10 text-center border-r border-[#22242e] bg-[#1a1b23]">
                      <input 
                        type="checkbox" 
                        checked={selectedShotIds.size === filteredShots.length && filteredShots.length > 0} 
                        onChange={toggleAllShots} 
                        className="rounded accent-amber-500 cursor-pointer"
                      />
                    </th>
                    
                    {allColumns.filter(c => visibleColumnIds.has(c.id)).map(col => {
                      let totalHeaderCount = 0;
                      if (col.isDynamic) {
                        totalHeaderCount = descriptions.filter(d => d.type === col.type && !d.isResolved).length;
                      } else if (col.id === 'description') {
                        // All descriptions of types that are not visible dynamic types
                        totalHeaderCount = descriptions.filter(d => !visibleDynamicTypes.includes(d.type) && !d.isResolved).length;
                      }
                      
                      const isCustom = col.isCustomNormal;
                      return (
                        <th 
                          key={col.id} 
                          className={`px-4 py-3.5 font-bold border-r border-[#22242e] transition-colors group/header ${
                            isCustom 
                              ? 'text-sky-400 bg-sky-950/15 border-sky-950/30' 
                              : 'text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              {isCustom && (
                                <span className="bg-sky-500/10 text-sky-400 text-[8px] font-bold px-1 py-0.2 rounded border border-sky-500/30 font-sans shrink-0 uppercase">
                                  自建
                                </span>
                              )}
                              <span className="truncate">{col.label}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {totalHeaderCount > 0 && (
                                <span className="bg-red-500/10 text-red-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-red-500/40 font-mono shrink-0">
                                  {totalHeaderCount}
                                </span>
                              )}
                              {(col.id === 'name' || col.id === 'sceneName') && <ArrowUpDown size={10} className="text-zinc-600 shrink-0" />}
                              
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCustomField(col.fieldConfig);
                                    setIsEditCustomFieldOpen(true);
                                  }}
                                  className="text-sky-400 hover:text-sky-300 p-0.5 rounded hover:bg-sky-500/10 cursor-pointer opacity-60 group-hover/header:opacity-100 transition-all"
                                  title="编辑字段配置"
                                >
                                  <Settings size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242e] bg-[#121318]">
                  {filteredShots.map((shot, idx) => {
                    const isSelected = selectedShotIds.has(shot.id);
                    const shotDescriptions = descriptions.filter(d => d.shotId === shot.id && !d.isResolved);
                    
                    return (
                      <tr 
                        key={shot.id} 
                        className={`transition-colors group cursor-pointer ${
                          isSelected 
                            ? 'bg-[#232021]/80 text-[#f97316] font-semibold border-l-2 border-l-orange-500' 
                            : 'hover:bg-[#1a1c24] text-zinc-300'
                        }`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.closest('input') || 
                            target.closest('select') || 
                            target.closest('textarea') || 
                            target.closest('button') || 
                            target.closest('.no-row-click') ||
                            editingCell?.shotId === shot.id
                          ) {
                            return;
                          }
                          setSelectedShot(shot);
                        }}
                      >
                        {/* Selector Row */}
                        <td className="px-4 py-3 text-center border-r border-[#22242e]/60 bg-[#16171d]/30 no-row-click">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleShotSelection(shot.id)} 
                            className="rounded accent-orange-500 cursor-pointer"
                          />
                        </td>

                        {allColumns.filter(c => visibleColumnIds.has(c.id)).map(col => {
                          
                          // 1. Index (序号)
                          if (col.id === 'index') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-zinc-500 text-center w-12 font-mono border-r border-[#22242e]/60">
                                {idx + 1}
                              </td>
                            );
                          }

                          // 2. Name (Code) - clickable to trigger detail modal
                          if (col.id === 'name') {
                            return (
                              <td 
                                key={col.id} 
                                className={`px-4 py-3 font-semibold font-mono border-r border-[#22242e]/60 cursor-pointer transition-colors ${
                                  isSelected ? 'text-orange-500' : 'text-zinc-100 hover:text-amber-500'
                                }`} 
                                onClick={() => setSelectedShot(shot)}
                              >
                                {shot.name}
                              </td>
                            );
                          }

                          // 3. Scene Name (场景)
                          if (col.id === 'sceneName') {
                            return (
                              <td key={col.id} className={`px-4 py-3 border-r border-[#22242e]/60 ${isSelected ? 'text-orange-500' : 'text-zinc-200'}`}>
                                {shot.sceneName}
                              </td>
                            );
                          }

                          // 4. Timeline Name (场景时间线名称)
                          if (col.id === 'timelineName') {
                            return (
                              <td key={col.id} className={`px-4 py-3 border-r border-[#22242e]/60 ${isSelected ? 'text-orange-500 font-medium' : 'text-zinc-400 font-mono'}`}>
                                {shot.timelineName || 'Tev_测试'}
                              </td>
                            );
                          }

                          // 5. Start Frame Thumbnail (镜头起幅)
                          if (col.id === 'startThumbnailUrl') {
                            const imgUrl = shot.startThumbnailUrl;
                            return (
                              <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60 w-24">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    alt="起幅" 
                                    className="w-16 h-11 object-cover rounded border border-zinc-700 bg-zinc-800 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                    onClick={() => setSelectedShot(shot)}
                                  />
                                ) : (
                                  <div className="w-16 h-11 rounded border border-zinc-800 bg-[#16171d] flex items-center justify-center text-zinc-700">
                                    <ImageIcon size={14} />
                                  </div>
                                )}
                              </td>
                            );
                          }

                          // 6. Video Thumbnail/Frame (镜视频)
                          if (col.id === 'videoUrl') {
                            const hasVideo = !!shot.production.videoUrl;
                            return (
                              <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60 w-24">
                                {hasVideo ? (
                                  <div 
                                    onClick={() => setSelectedShot(shot)}
                                    className="w-16 h-11 rounded border border-[#10b981]/40 bg-[#10b981]/10 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                                    title="点击播放预演镜视频"
                                  >
                                    <div className="absolute inset-0 bg-[#10b981]/20 opacity-40 hover:opacity-100 transition-opacity"></div>
                                    <div className="bg-[#10b981] p-1 rounded-full text-white shadow-md z-10">
                                      <Play size={10} fill="#fff" />
                                    </div>
                                    <div className="absolute bottom-0.5 right-1 text-[8px] text-[#10b981] font-bold font-mono">0:05</div>
                                  </div>
                                ) : (
                                  <div className="w-16 h-11 rounded border border-zinc-800 bg-[#16171d] flex items-center justify-center text-zinc-700">
                                    {/* Paperplane/arrow indicator placeholder similar to mockup */}
                                    <span className="text-[10px] font-bold tracking-tighter opacity-40 font-mono">✦ NoVid</span>
                                  </div>
                                )}
                              </td>
                            );
                          }

                          // 7. End Frame Thumbnail (镜头落幅)
                          if (col.id === 'endThumbnailUrl') {
                            const imgUrl = shot.endThumbnailUrl;
                            return (
                              <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60 w-24">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    alt="落幅" 
                                    className="w-16 h-11 object-cover rounded border border-zinc-700 bg-zinc-800 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                    onClick={() => setSelectedShot(shot)}
                                  />
                                ) : (
                                  <div className="w-16 h-11 rounded border border-zinc-800 bg-[#16171d] flex items-center justify-center text-zinc-700">
                                    <ImageIcon size={14} />
                                  </div>
                                )}
                              </td>
                            );
                          }

                          // 8. Involved Area (涉及区域)
                          if (col.id === 'involvedArea') {
                            const imgUrl = shot.involvedAreaUrl;
                            return (
                              <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60 w-24">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    alt="区域" 
                                    className="w-16 h-11 object-cover rounded border border-zinc-700 bg-zinc-800 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                    onClick={() => setSelectedShot(shot)}
                                  />
                                ) : (
                                  <div className="w-16 h-11 rounded border border-zinc-800 bg-[#16171d] flex items-center justify-center text-zinc-700">
                                    <ImageIcon size={14} />
                                  </div>
                                )}
                              </td>
                            );
                          }

                          // 9. Engineering Drawing (工程图 - 外面展示最新工程图，点开可切换版本)
                          if (col.id === 'techvizDrawing') {
                            const drawings = shot.engineeringDrawings && shot.engineeringDrawings.length > 0
                              ? shot.engineeringDrawings
                              : (shot.techvizDrawingUrl ? [{
                                  version: 'V1',
                                  name: '工程图',
                                  createdAt: '2026-08-15',
                                  author: '工程部',
                                  images: [{ id: 'img_1', url: shot.techvizDrawingUrl, name: '工程图纸 1' }]
                                }] : []);
                            
                            // 外面仅展示最新版本
                            const latestVer = drawings.length > 0 ? drawings[drawings.length - 1] : null;
                            const latestImages = latestVer?.images || [];
                            const previewImg = latestImages[0]?.url || shot.techvizDrawingUrl;
                            const totalImages = latestImages.length;
                            
                            return (
                              <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60 w-24">
                                {drawings.length > 0 && previewImg ? (
                                  <div 
                                    onClick={() => setDrawingModalShot(shot)}
                                    className="relative w-16 h-11 rounded border border-zinc-700 bg-zinc-800 shadow-sm overflow-hidden group cursor-pointer hover:border-amber-500/80 transition-all"
                                    title={`点击查看工程图及多版本切换 (最新: ${latestVer?.version || 'V1'})`}
                                  >
                                    <img 
                                      src={previewImg} 
                                      alt="最新工程图" 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                    
                                    {/* 最新版本号角标 */}
                                    <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/85 backdrop-blur-xs text-[8px] font-mono text-amber-400 font-bold border border-amber-500/40 leading-tight">
                                      {latestVer?.version || 'V1'}
                                    </div>

                                    {/* 多图数量角标 */}
                                    {totalImages > 1 && (
                                      <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-zinc-300 font-bold leading-tight">
                                        {totalImages}图
                                      </div>
                                    )}

                                    {/* 悬浮提示 */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-amber-300 font-medium z-10">
                                      <Eye size={11} className="mr-0.5" /> 切换/查看
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDrawingModalShot(shot)}
                                    className="w-16 h-11 rounded border border-dashed border-zinc-800 hover:border-amber-500/60 bg-[#16171d] hover:bg-zinc-800/60 flex flex-col items-center justify-center text-zinc-600 hover:text-amber-400 transition-colors"
                                    title="点击添加工程图"
                                  >
                                    <ImageIcon size={12} className="mb-0.5" />
                                    <span className="text-[9px] scale-90">加工程图</span>
                                  </button>
                                )}
                              </td>
                            );
                          }

                          // 10. Drawing No (工程图编号)
                          if (col.id === 'techvizDrawingNo') {
                            const val = shot.techvizDrawingNo || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[120px]">
                                  <input 
                                    type="text" 
                                    autoFocus
                                    value={editingCell.text} 
                                    onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                    onBlur={saveInlineEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveInlineEdit();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="bg-black border border-zinc-700 text-xs text-white rounded px-1.5 py-1 w-full focus:outline-none focus:border-amber-500"
                                  />
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-400 font-mono cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val); }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span>{val || '--'}</span>
                                  <Edit3 size={11} className="text-zinc-600 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // 11. Shooting Method (拍摄方式)
                          if (col.id === 'shootingMethod') {
                            const val = shot.shootingMethod || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[200px]">
                                  <textarea 
                                    rows={3}
                                    autoFocus
                                    value={editingCell.text} 
                                    onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                    onBlur={saveInlineEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        saveInlineEdit();
                                      }
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="bg-black border border-zinc-800 text-xs text-white rounded p-1.5 w-full font-mono focus:outline-none focus:border-amber-500"
                                  />
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-300 font-sans max-w-[200px] whitespace-pre-wrap leading-tight cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val); }}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <span className="text-[11px] font-mono leading-relaxed">{val || '--'}</span>
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 mt-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // 12. Digital Human (数字人)
                          if (col.id === 'digitalHuman') {
                            const val = shot.digitalHuman || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[200px]">
                                  <div 
                                    onBlur={handleBlurContainer}
                                    className="flex flex-col gap-1.5 bg-[#16171d] p-2 rounded border border-zinc-700"
                                  >
                                    <input 
                                      type="text"
                                      autoFocus
                                      value={editingCell.text} 
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      className="bg-black border border-zinc-800 text-xs text-white rounded p-1.5 w-full font-mono focus:outline-none focus:border-amber-500"
                                      placeholder="数字人信息..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-zinc-500">工期(日):</span>
                                      <input 
                                        type="number"
                                        value={editingCell.days || 0}
                                        onChange={(e) => setEditingCell({ ...editingCell, days: Number(e.target.value) })}
                                        className="bg-black border border-zinc-800 text-xs text-white rounded px-1.5 py-0.5 w-16 text-center focus:outline-none focus:border-amber-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveInlineEdit();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-300 max-w-[180px] truncate cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val, shot.digitalHumanDays); }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate">{val || '--'}</span>
                                    {shot.digitalHumanDays !== undefined && (
                                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                                        {shot.digitalHumanDays}日
                                      </span>
                                    )}
                                  </div>
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // 13. Techviz Notes (Techviz备注)
                          if (col.id === 'techvizNotes') {
                            const val = shot.techvizNotes || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[200px]">
                                  <div 
                                    onBlur={handleBlurContainer}
                                    className="flex flex-col gap-1.5 bg-[#16171d] p-2 rounded border border-zinc-700"
                                  >
                                    <input 
                                      type="text"
                                      autoFocus
                                      value={editingCell.text} 
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      className="bg-black border border-zinc-800 text-xs text-white rounded p-1.5 w-full font-mono focus:outline-none focus:border-amber-500"
                                      placeholder="备注内容..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-zinc-500">工期(日):</span>
                                      <input 
                                        type="number"
                                        value={editingCell.days || 0}
                                        onChange={(e) => setEditingCell({ ...editingCell, days: Number(e.target.value) })}
                                        className="bg-black border border-zinc-800 text-xs text-white rounded px-1.5 py-0.5 w-16 text-center focus:outline-none focus:border-amber-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveInlineEdit();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-300 max-w-[150px] truncate cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val, shot.techvizNotesDays); }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate">{val || '--'}</span>
                                    {shot.techvizNotesDays !== undefined && (
                                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                                        {shot.techvizNotesDays}日
                                      </span>
                                    )}
                                  </div>
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // 14. VFX Notes (视效备注)
                          if (col.id === 'vfxNotes') {
                            const val = shot.vfxNotes || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[200px]">
                                  <div 
                                    onBlur={handleBlurContainer}
                                    className="flex flex-col gap-1.5 bg-[#16171d] p-2 rounded border border-zinc-700"
                                  >
                                    <input 
                                      type="text"
                                      autoFocus
                                      value={editingCell.text} 
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      className="bg-black border border-zinc-800 text-xs text-white rounded p-1.5 w-full font-mono focus:outline-none focus:border-amber-500"
                                      placeholder="视效备注..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-zinc-500">反馈工期(日):</span>
                                      <input 
                                        type="number"
                                        value={editingCell.days || 0}
                                        onChange={(e) => setEditingCell({ ...editingCell, days: Number(e.target.value) })}
                                        className="bg-black border border-zinc-800 text-xs text-white rounded px-1.5 py-0.5 w-16 text-center focus:outline-none focus:border-amber-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveInlineEdit();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-300 max-w-[150px] truncate cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val, shot.vfxNotesDays); }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate">{val || '--'}</span>
                                    {shot.vfxNotesDays !== undefined && (
                                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                                        {shot.vfxNotesDays}日
                                      </span>
                                    )}
                                  </div>
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // 15. Progress Status (进度)
                          if (col.id === 'progress') {
                            const val = shot.progress || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[120px]">
                                  <select 
                                    autoFocus
                                    value={editingCell.text} 
                                    onChange={(e) => {
                                      setEditingCell({ ...editingCell, text: e.target.value });
                                      updateShotField(shot.id, col.id, e.target.value);
                                    }}
                                    onBlur={saveInlineEdit}
                                    className="bg-black border border-zinc-700 text-xs text-white rounded p-1 w-full focus:outline-none focus:border-amber-500 text-center"
                                  >
                                    <option value="">(空)</option>
                                    <option value="已准备">已准备</option>
                                    <option value="进行中">进行中</option>
                                    <option value="审核中">审核中</option>
                                  </select>
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, val); }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  {val ? (
                                    <span className="bg-zinc-800/80 text-zinc-300 font-bold px-2 py-0.5 rounded border border-zinc-700/60 font-sans text-[11px]">
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600">--</span>
                                  )}
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          // --- Standard VFX Columns Rendering Fallbacks ---
                          if (col.id === 'thumbnailUrl') return (
                            <td key={col.id} className="px-4 py-2 border-r border-[#22242e]/60">
                              {shot.production.thumbnailUrl && (
                                <img src={shot.production.thumbnailUrl} alt={shot.name} className="w-12 h-9 object-cover rounded border border-zinc-800 bg-zinc-900" />
                              )}
                            </td>
                          );
                          if (col.id === 'status') return (
                            <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                shot.production.status === '完成' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                              }`}>
                                {shot.production.status}
                              </span>
                            </td>
                          );
                          if (col.id === 'level') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 font-bold text-amber-500">{shot.production.level}</td>;
                          
                           if (col.id === 'description') {
                            const descriptionsToShow = shotDescriptions.filter(d => !visibleDynamicTypes.includes(d.type));
                            return (
                              <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 min-w-[200px]">
                                <div className="flex flex-col gap-1">
                                  {descriptionsToShow.length > 0 ? (
                                    <>
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[9px] bg-red-500/10 text-red-400 font-mono px-1 py-0.5 rounded border border-red-500/40">
                                          其他意见 ({descriptionsToShow.length})
                                        </span>
                                      </div>
                                      {descriptionsToShow.map(desc => (
                                        <div key={desc.id} className="text-[10px] bg-zinc-900 border border-zinc-800/80 p-1 rounded truncate text-zinc-400 flex items-center justify-between gap-1" title={desc.content}>
                                          <span className="truncate">
                                            <span className="font-semibold text-zinc-300">{desc.type}:</span> {desc.content}
                                          </span>
                                          {desc.imageUrl && <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-300 px-0.5 rounded font-bold shrink-0">🎨 涂鸦</span>}
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <button onClick={() => setSelectedShot(shot)} className="text-zinc-600 hover:text-zinc-400 self-start p-0.5"><Plus size={14}/></button>
                                  )}
                                </div>
                              </td>
                            );
                          }
 
                           if (col.isDynamic) {
                            const cellDescs = shotDescriptions.filter(d => d.type === col.type);
                            return (
                              <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 min-w-[200px]">
                                <div className="flex flex-col gap-1">
                                  {cellDescs.length > 0 && (
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[9px] bg-red-500/10 text-red-400 font-mono px-1 py-0.5 rounded border border-red-500/40">
                                        意见数量 ({cellDescs.length})
                                      </span>
                                    </div>
                                  )}
                                  {cellDescs.map(desc => (
                                    <div key={desc.id} className="text-[10px] bg-zinc-900 border border-zinc-800/80 p-1 rounded truncate text-zinc-400 flex items-center justify-between gap-1" title={desc.content}>
                                      <span className="truncate">
                                        <span className="font-semibold text-[#f97316]">{desc.type}:</span> {desc.content}
                                      </span>
                                      {desc.imageUrl && <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-300 px-0.5 rounded font-bold shrink-0">🎨 涂鸦</span>}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          if (col.isCustomNormal) {
                            const val = (shot as any)[col.id] || '';
                            const isEditing = editingCell?.shotId === shot.id && editingCell?.field === col.id;
                            const config = col.fieldConfig;

                            if (isEditing) {
                              return (
                                <td key={col.id} className="px-2 py-1.5 border-r border-[#22242e]/60 min-w-[150px]">
                                  {config.type === 'select' ? (
                                    <select
                                      autoFocus
                                      value={editingCell.text}
                                      onChange={(e) => {
                                        if (e.target.value === '_add_new_option_') {
                                          const newOpt = prompt('请输入新选项名称:');
                                          if (newOpt && newOpt.trim()) {
                                            const trimmed = newOpt.trim();
                                            // Add option
                                            setCustomNormalFields(prev => prev.map(f => {
                                              if (f.id === config.id) {
                                                const currentOpts = f.options || [];
                                                if (!currentOpts.includes(trimmed)) {
                                                  return { ...f, options: [...currentOpts, trimmed] };
                                                }
                                              }
                                              return f;
                                            }));
                                            setEditingCell({ ...editingCell, text: trimmed });
                                            updateShotField(shot.id, col.id, trimmed);
                                          }
                                        } else {
                                          setEditingCell({ ...editingCell, text: e.target.value });
                                          updateShotField(shot.id, col.id, e.target.value);
                                        }
                                      }}
                                      onBlur={saveInlineEdit}
                                      className="bg-black border border-zinc-700 text-xs text-white rounded p-1 w-full focus:outline-none"
                                    >
                                      <option value="">(空)</option>
                                      {(config.options || []).map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                      <option value="_add_new_option_" className="text-blue-400 font-bold">+ 新增选项...</option>
                                    </select>
                                  ) : config.type === 'number' ? (
                                    <input
                                      type="number"
                                      autoFocus
                                      value={editingCell.text}
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      onBlur={saveInlineEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      className="bg-black border border-zinc-700 text-xs text-white rounded p-1 w-full font-mono font-bold focus:outline-none focus:border-amber-500"
                                    />
                                  ) : config.type === 'date' ? (
                                    <input
                                      type="date"
                                      autoFocus
                                      value={editingCell.text}
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      onBlur={saveInlineEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      className="bg-black border border-zinc-700 text-xs text-white rounded p-1 w-full font-mono text-xs focus:outline-none focus:border-amber-500"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingCell.text}
                                      onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                                      onBlur={saveInlineEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveInlineEdit();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      className="bg-black border border-zinc-700 text-xs text-white rounded p-1 w-full focus:outline-none focus:border-amber-500"
                                    />
                                  )}
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={col.id} 
                                className="px-4 py-3 border-r border-[#22242e]/60 cursor-pointer hover:bg-zinc-800/30 group/cell"
                                onClick={(e) => { e.stopPropagation(); startInlineEdit(shot.id, col.id, String(val)); }}
                              >
                                <div className="flex items-center justify-between gap-1.5 min-w-[100px]">
                                  {val ? (
                                    <span className="text-zinc-200">
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600">--</span>
                                  )}
                                  <Edit3 size={11} className="text-zinc-600 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            );
                          }

                          if (col.id === 'clipName') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 font-mono text-zinc-500">{shot.clipName}</td>;
                          if (col.id === 'frameRate') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-400">{shot.frameRate} fps</td>;
                          if (col.id === 'frameCount') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-300 font-bold">{shot.frameCount}</td>;
                          if (col.id === 'assignedUserId') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-400">{shot.production.assignedUserId || '未指派'}</td>;
                          if (col.id === 'deadline') return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60 text-zinc-500 font-mono">{shot.production.deadline || '--'}</td>;

                          return <td key={col.id} className="px-4 py-3 border-r border-[#22242e]/60"></td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Table Footer / Mock Pagination (Matches screenshot pagination elements) */}
            <div className="px-6 py-4 border-t border-[#282a36] bg-[#1a1b23] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="text-zinc-500 font-sans">
                共 <span className="text-white font-semibold">{filteredShots.length}</span> 条数据
              </div>
              
              <div className="flex items-center gap-4">
                {/* Page Select controller */}
                <div className="flex items-center gap-1.5">
                  <button className="px-2.5 py-1 rounded bg-[#0f1013] border border-[#282a36] text-zinc-400 hover:text-white transition-colors cursor-pointer" disabled>&lt;</button>
                  <button className="px-3 py-1 rounded bg-amber-500 text-zinc-950 font-bold shadow">1</button>
                  <button className="px-2.5 py-1 rounded bg-[#0f1013] border border-[#282a36] text-zinc-400 hover:text-white transition-colors cursor-pointer" disabled>&gt;</button>
                </div>

                {/* Page size picker mock */}
                <div className="flex items-center gap-1 text-zinc-500">
                  <select className="bg-[#0f1013] border border-[#282a36] text-zinc-300 rounded px-2 py-1 text-xs outline-none focus:border-amber-500">
                    <option value="30">30 条/页</option>
                    <option value="50">50 条/页</option>
                    <option value="100">100 条/页</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          
          /* 5. Swimlane / Board View */
          <div className="flex gap-4 overflow-x-auto pb-4 overscroll-x-none flex-1">
            {['待分配', '制作中', '审核中', '完成'].map((status) => {
              const columnShots = filteredShots.filter((s) => s.production.status === status);
              return (
                <div key={status} className="flex-shrink-0 w-80 bg-[#18191f] rounded-xl p-4 flex flex-col gap-3.5 border border-[#282a36]">
                  <div className="flex justify-between items-center border-b border-[#282a36] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <h3 className="font-bold text-xs text-white uppercase tracking-wider">{status}</h3>
                    </div>
                    <span className="text-xs text-zinc-400 bg-[#0f1013] border border-[#282a36] px-2 py-0.5 rounded-full font-mono font-bold">
                      {columnShots.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 max-h-[60vh] pr-1">
                    {columnShots.map((shot) => (
                      <div 
                        key={shot.id} 
                        className="bg-[#121318] hover:bg-[#1a1c24] p-3.5 rounded-lg border border-[#282a36]/60 cursor-pointer transition-all hover:border-amber-500/50" 
                        onClick={() => setSelectedShot(shot)}
                      >
                        {shot.startThumbnailUrl && (
                          <img src={shot.startThumbnailUrl} alt={shot.name} className="w-full h-36 object-cover rounded mb-2.5 border border-[#2c2f3c]" />
                        )}
                        <div className="font-bold font-mono text-white text-xs leading-tight mb-1.5">{shot.name}</div>
                        <div className="text-[11px] text-zinc-500 font-medium truncate mb-2">{shot.sceneName} | {shot.timelineName || 'Tev_测试'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10 font-bold font-mono">等级: {shot.production.level}</span>
                          <span className="text-[10px] text-zinc-400 bg-[#1c1d24] px-1.5 py-0.5 rounded border border-[#2c2f3c]">{shot.production.assignedUserId || '未指派'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* 6. Active Modals and Overlays */}
      {selectedShot && (
        <ShotModal 
          shot={selectedShot} 
          onClose={() => setSelectedShot(null)} 
          descriptions={descriptions}
          vfxDescriptionTypes={vfxDescriptionTypes}
          techvizDescriptionTypes={techvizDescriptionTypes}
          onAddDescription={handleAddDescription}
          onRemoveDescription={handleRemoveDescription}
          onToggleResolveDescription={handleToggleResolveDescription}
          onUpdateField={(shotId, field, value, daysField, daysValue) => {
            updateShotField(shotId, field, value, daysField, daysValue);
            // Sync current selected shot reference instantly for immediate modal view update
            setSelectedShot(prev => {
              if (!prev || prev.id !== shotId) return prev;
              const next = { ...prev, [field]: value };
              if (daysField && daysValue !== undefined) {
                (next as any)[daysField] = daysValue;
              }
              return next;
            });
          }}
        />
      )}
      
      {isFilterOpen && <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => {}} />}
      
      {isColumnConfigOpen && (
        <ColumnConfigModal
          isOpen={isColumnConfigOpen}
          onClose={() => setIsColumnConfigOpen(false)}
          allColumns={allColumns}
          visibleColumnIds={visibleColumnIds}
          onToggle={toggleColumn}
          onSelectAll={handleSelectAllColumns}
          onAddDescriptionField={handleAddDescriptionField}
          onAddCustomNormalField={handleAddCustomNormalField}
        />
      )}
      
      {isDescManagerOpen && (
        <DescriptionManagerModal
          isOpen={isDescManagerOpen}
          onClose={() => setIsDescManagerOpen(false)}
          descriptionTypes={descriptionTypes}
          onAdd={addDescriptionType}
          onRemove={removeDescriptionType}
        />
      )}

      {editingCustomField && (
        <EditCustomFieldModal
          isOpen={!!editingCustomField}
          onClose={() => setEditingCustomField(null)}
          field={editingCustomField}
          onSave={handleSaveCustomField}
          onDelete={handleDeleteCustomField}
        />
      )}

      {drawingModalShot && (
        <EngineeringDrawingModal
          isOpen={!!drawingModalShot}
          onClose={() => setDrawingModalShot(null)}
          shot={drawingModalShot}
          onUpdateDrawings={handleUpdateDrawings}
        />
      )}
    </div>
  );
}
