import { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Eye, Download, ZoomIn, ZoomOut, RotateCw, 
  Maximize2, Minimize2, Check, ArrowLeft, ArrowRight, Layers,
  Calendar, User, FileText, Image as ImageIcon, SplitSquareHorizontal,
  ChevronLeft, ChevronRight, Upload, Sparkles, SlidersHorizontal,
  GitBranch
} from 'lucide-react';
import { BaseShot, DrawingVersion, DrawingImage } from '../types';

// Preset sample engineering blueprint images
export const PRESET_DRAWINGS = [
  {
    name: '机位平面俯视动线图',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=800&fit=crop',
    description: '标定A/B机位轨道距离与人员安全区'
  },
  {
    name: '机械臂包络与避障分析图',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&h=800&fit=crop',
    description: 'Kuka机械臂工作半径3.1米，已标明极限旋转角'
  },
  {
    name: '灯光矩阵与色温标定图',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&h=800&fit=crop',
    description: '天幕LED灯组 5600K 匹配现场日光'
  },
  {
    name: '绿幕规格与追踪点位分布',
    url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&h=800&fit=crop',
    description: '环形绿幕半径8米，十字Mark点间距50cm'
  },
  {
    name: '3D相机运动轨迹空间标定',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
    description: 'Maya摄像机导出FBX坐标系与实拍对齐'
  },
  {
    name: '实拍现场置景标高立面图',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=800&fit=crop',
    description: '地铁闸机站台高度1.15米'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shot: BaseShot;
  onUpdateDrawings: (shotId: string, drawings: DrawingVersion[], selectedVersion?: string) => void;
}

export default function EngineeringDrawingModal({
  isOpen,
  onClose,
  shot,
  onUpdateDrawings
}: Props) {
  const [versions, setVersions] = useState<DrawingVersion[]>(shot.engineeringDrawings || []);
  const [currentVersionKey, setCurrentVersionKey] = useState<string>(
    shot.selectedDrawingVersion || (shot.engineeringDrawings?.[shot.engineeringDrawings.length - 1]?.version || 'V1')
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  // Transform / zoom states
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Compare mode states
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareVersionKey, setCompareVersionKey] = useState<string>('');
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50);

  // Add / Upload Dialogs
  const [showAddVersionModal, setShowAddVersionModal] = useState<boolean>(false);
  const [newVersionTag, setNewVersionTag] = useState<string>('');
  const [newVersionName, setNewVersionName] = useState<string>('');
  const [newVersionAuthor, setNewVersionAuthor] = useState<string>('Techviz团队');
  const [newVersionDesc, setNewVersionDesc] = useState<string>('');

  const [showAddImageModal, setShowAddImageModal] = useState<boolean>(false);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageName, setNewImageName] = useState<string>('');
  const [newImageDesc, setNewImageDesc] = useState<string>('');

  // Sync when shot changes
  useEffect(() => {
    const list = shot.engineeringDrawings && shot.engineeringDrawings.length > 0 
      ? shot.engineeringDrawings 
      : (shot.techvizDrawingUrl ? [{
          version: 'V1',
          name: '初始工程图',
          createdAt: new Date().toLocaleDateString('zh-CN'),
          author: '工程部',
          description: '系统自动从旧版工程图导入',
          images: [{
            id: 'img_init_1',
            url: shot.techvizDrawingUrl,
            name: '工程图 01'
          }]
        }] : []);

    setVersions(list);
    const active = shot.selectedDrawingVersion || (list[list.length - 1]?.version || 'V1');
    setCurrentVersionKey(active);
    setSelectedImageIndex(0);
    setZoom(1);
    setRotation(0);
    setIsCompareMode(false);
  }, [shot]);

  if (!isOpen) return null;

  const currentVersion = versions.find(v => v.version === currentVersionKey) || versions[0];
  const currentImages = currentVersion?.images || [];
  const activeImage = currentImages[selectedImageIndex] || currentImages[0];

  const compareVersion = versions.find(v => v.version === compareVersionKey) || (versions.find(v => v.version !== currentVersionKey) || versions[0]);
  const compareImage = compareVersion?.images?.[0];

  // Save changes to parent state
  const saveVersions = (updated: DrawingVersion[], activeKey?: string) => {
    setVersions(updated);
    const key = activeKey || currentVersionKey;
    onUpdateDrawings(shot.id, updated, key);
  };

  // Add new version
  const handleCreateVersion = () => {
    if (!newVersionTag.trim()) {
      alert('请输入版本号，例如：V2、V2.1');
      return;
    }
    const tag = newVersionTag.trim().toUpperCase();
    if (versions.some(v => v.version.toUpperCase() === tag)) {
      alert('该版本号已存在，请输入新的版本号');
      return;
    }

    const defaultImg = PRESET_DRAWINGS[Math.floor(Math.random() * PRESET_DRAWINGS.length)];
    const newVer: DrawingVersion = {
      version: tag,
      name: newVersionName.trim() || `工程图 ${tag}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: newVersionAuthor.trim() || '工程部',
      description: newVersionDesc.trim() || '更新了机位布局与工程图纸',
      images: [
        {
          id: `img_${Date.now()}_1`,
          url: defaultImg.url,
          name: defaultImg.name,
          description: defaultImg.description,
          uploadedAt: new Date().toLocaleDateString('zh-CN')
        }
      ]
    };

    const updated = [...versions, newVer];
    saveVersions(updated, tag);
    setCurrentVersionKey(tag);
    setSelectedImageIndex(0);
    setShowAddVersionModal(false);
    setNewVersionTag('');
    setNewVersionName('');
    setNewVersionDesc('');
  };

  // Delete version
  const handleDeleteVersion = (versionTag: string) => {
    if (versions.length <= 1) {
      alert('至少需要保留一个版本或清空所有');
      return;
    }
    if (!confirm(`确定要删除版本 ${versionTag} 吗？`)) return;

    const updated = versions.filter(v => v.version !== versionTag);
    const fallbackKey = updated[updated.length - 1]?.version || 'V1';
    setCurrentVersionKey(fallbackKey);
    setSelectedImageIndex(0);
    saveVersions(updated, fallbackKey);
  };

  // Set active version for table display
  const handleSetDefaultVersion = (versionTag: string) => {
    setCurrentVersionKey(versionTag);
    onUpdateDrawings(shot.id, versions, versionTag);
  };

  // Add image to current version
  const handleAddImageToCurrentVersion = (url?: string, name?: string, desc?: string) => {
    const targetUrl = url || newImageUrl.trim();
    if (!targetUrl) {
      alert('请输入或选择图片');
      return;
    }

    const newImg: DrawingImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: targetUrl,
      name: (name || newImageName.trim()) || `工程图图纸 ${currentImages.length + 1}`,
      description: desc || newImageDesc.trim(),
      uploadedAt: new Date().toLocaleDateString('zh-CN')
    };

    const updated = versions.map(v => {
      if (v.version === currentVersionKey) {
        return {
          ...v,
          images: [...(v.images || []), newImg]
        };
      }
      return v;
    });

    saveVersions(updated);
    setSelectedImageIndex(currentImages.length);
    setShowAddImageModal(false);
    setNewImageUrl('');
    setNewImageName('');
    setNewImageDesc('');
  };

  // Delete image from current version
  const handleDeleteImage = (imgId: string) => {
    if (currentImages.length <= 1) {
      alert('当前版本至少需要保留一张图片');
      return;
    }
    if (!confirm('确定删除此张工程图吗？')) return;

    const updated = versions.map(v => {
      if (v.version === currentVersionKey) {
        return {
          ...v,
          images: v.images.filter(img => img.id !== imgId)
        };
      }
      return v;
    });

    saveVersions(updated);
    setSelectedImageIndex(0);
  };

  // Quick preset insert
  const handleInsertPreset = (preset: typeof PRESET_DRAWINGS[0]) => {
    handleAddImageToCurrentVersion(preset.url, preset.name, preset.description);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn select-none">
      <div className={`bg-[#121318] border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 transition-all ${
        isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-6xl h-[90vh]'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-[#16171d]/95 gap-3">
          {/* Left: Shot Name + Drawing Title (红框内显示: 镜头号+工程图) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Layers size={15} />
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">{shot.name} 工程图</h2>
          </div>

          {/* Center: Engineering Drawing Version Switcher (版本使用下拉切换查看) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 bg-[#0f1015] px-2.5 py-1 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium select-none flex items-center gap-1">
                <span>版本:</span>
              </span>
              <select
                value={currentVersionKey}
                onChange={(e) => {
                  setCurrentVersionKey(e.target.value);
                  setSelectedImageIndex(0);
                  setZoom(1);
                }}
                className="bg-[#181920] hover:bg-zinc-800 text-xs font-bold text-amber-400 border border-zinc-700/80 hover:border-zinc-700 rounded px-2.5 py-1 focus:outline-none cursor-pointer"
                title="切换版本"
              >
                {versions.map(v => (
                  <option key={v.version} value={v.version} className="bg-[#121318] text-zinc-300 font-sans">
                    {v.version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              title={isFullscreen ? '退出全屏' : '全屏预览'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Body Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-[#0a0b0e]">
          {/* Main Visualizer Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Viewport Canvas Toolbar */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-zinc-800 shadow-xl">
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="缩小"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 px-1 font-bold">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="放大"
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5" />
              <button
                onClick={() => setZoom(1)}
                className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="重置缩放 100%"
              >
                1:1
              </button>
              <button
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="顺时针旋转90度"
              >
                <RotateCw size={14} />
              </button>
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              {activeImage?.url ? (
                <div 
                  className="transition-transform duration-150 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                  }}
                >
                  <img 
                    src={activeImage.url} 
                    alt={activeImage.name} 
                    className="max-h-[72vh] max-w-[85vw] object-contain rounded-lg border border-zinc-800 shadow-2xl bg-zinc-900 pointer-events-auto animate-fadeIn"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <ImageIcon size={36} className="opacity-40" />
                  <p className="text-xs">当前暂无工程图纸</p>
                  <button
                    onClick={() => setShowAddImageModal(true)}
                    className="px-3 py-1.5 rounded bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 mt-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload size={14} /> 上传工程图
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Drawing Basic Info */}
          <div className="w-full md:w-80 bg-[#111218] border-t md:border-t-0 md:border-l border-zinc-800/80 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 select-none">
            {/* Drawing Basic Info (工程图基本信息) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-800/60">
                <FileText size={15} className="text-amber-400" />
                <h3 className="text-xs font-bold text-zinc-200 tracking-wider uppercase">工程图基本信息</h3>
              </div>

              {activeImage ? (
                <div className="space-y-3.5 text-xs">
                  {/* Field 1: 图纸编号 */}
                  <div className="bg-[#181920] p-3 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[11px] mb-1 font-medium">图纸编号</span>
                    <span className="font-mono text-amber-400 font-bold text-sm tracking-wide block truncate" title={shot.techvizDrawingNo || `DWG-${shot.name}-${currentVersionKey}`}>
                      {shot.techvizDrawingNo || `DWG-${shot.name}-${currentVersionKey}`}
                    </span>
                  </div>

                  {/* Field 2: 上传人 */}
                  <div className="flex items-center justify-between py-2.5 px-3 bg-[#181920]/60 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <User size={13} className="text-zinc-500" />
                      <span>上传人</span>
                    </div>
                    <span className="text-white font-medium">
                      {currentVersion?.author || '王总监'}
                    </span>
                  </div>

                  {/* Field 3: 上传时间 */}
                  <div className="flex items-center justify-between py-2.5 px-3 bg-[#181920]/60 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar size={13} className="text-zinc-500" />
                      <span>上传时间</span>
                    </div>
                    <span className="text-zinc-300 font-mono text-[11px]">
                      {currentVersion?.createdAt || '2026-08-01 11:20'}
                    </span>
                  </div>

                  {/* Field 4: 关联镜头号（带版本） */}
                  <div className="flex items-center justify-between py-2.5 px-3 bg-[#181920]/60 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <GitBranch size={13} className="text-emerald-400" />
                      <span>关联镜头号</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-white font-bold tracking-wide">
                        {shot.name}
                      </span>
                      {shot.edlVersionId && (
                        <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                          {shot.edlVersionId.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: 上传按钮 & 删除当前版本 */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setShowAddImageModal(true)}
                      className="py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-md transition-all flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm cursor-pointer"
                      title="上传新工程图纸"
                    >
                      <Upload size={13} />
                      <span>上传图纸</span>
                    </button>

                    <button
                      onClick={() => handleDeleteVersion(currentVersionKey)}
                      disabled={versions.length <= 1}
                      className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 text-xs font-medium border ${
                        versions.length > 1
                          ? 'bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border-red-900/30 cursor-pointer'
                          : 'bg-zinc-850 text-zinc-600 border-zinc-800 cursor-not-allowed'
                      }`}
                      title={versions.length > 1 ? `删除当前版本 (${currentVersionKey})` : '至少需要保留一个版本'}
                    >
                      <Trash2 size={13} />
                      <span>删除当前版本</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-xs text-center py-6">
                  暂无图纸信息
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Version */}
      {showAddVersionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#181920] border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md p-6 text-zinc-100">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-amber-400" /> 新增工程图版本
              </h3>
              <button onClick={() => setShowAddVersionModal(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">版本标识 (如 V2, V2.1, V3)</label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="例如: V2"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">版本主题名称</label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="例如: 机械臂避障与机位复核图"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">制图负责人</label>
                <input
                  type="text"
                  value={newVersionAuthor}
                  onChange={(e) => setNewVersionAuthor(e.target.value)}
                  placeholder="例如: 李工 (Techviz)"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">版本变更说明 (Revision Notes)</label>
                <textarea
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  rows={2}
                  placeholder="说明该版本相对上一版本做了哪些调整..."
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVersionModal(false)}
                  className="flex-1 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded text-xs font-bold"
                >
                  确认创建版本
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Image to Version */}
      {showAddImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#181920] border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md p-6 text-zinc-100">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload size={16} className="text-amber-400" /> 添加工程图纸到 {currentVersionKey}
              </h3>
              <button onClick={() => setShowAddImageModal(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">图片 URL 地址</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">图纸标题 / 名称</label>
                <input
                  type="text"
                  value={newImageName}
                  onChange={(e) => setNewImageName(e.target.value)}
                  placeholder="例如: 俯视相机运动路线图"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">图纸备注说明</label>
                <input
                  type="text"
                  value={newImageDesc}
                  onChange={(e) => setNewImageDesc(e.target.value)}
                  placeholder="例如: 修正了3号轨道与立柱的安全距离"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddImageModal(false)}
                  className="flex-1 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleAddImageToCurrentVersion()}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded text-xs font-bold"
                >
                  添加到当前版本
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
