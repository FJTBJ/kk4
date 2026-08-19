import { useState, useRef, useEffect, useMemo } from 'react';
import { BaseShot, ProductionData, DescriptionEntry } from '../types';
import { 
  X, Send, Save, Film, Image as ImageIcon, Trash2, CheckSquare, 
  Edit, ShieldCheck, Paintbrush, Undo2, Trash, Check, Eye, ListFilter,
  FileText, MessageSquare, Info, Calendar, User, Clock, AlertCircle, Layout
} from 'lucide-react';

interface Props {
  shot: BaseShot & { production: ProductionData };
  onClose: () => void;
  onUpdateField?: (shotId: string, field: string, value: any, daysField?: string, daysValue?: number) => void;
  descriptions: DescriptionEntry[];
  vfxDescriptionTypes?: string[];
  techvizDescriptionTypes?: string[];
  onAddDescription?: (shotId: string, type: string, content: string, imageUrl?: string, author?: string) => void;
  onRemoveDescription?: (descId: string) => void;
  onToggleResolveDescription?: (descId: string) => void;
}

export default function ShotModal({ 
  shot, 
  onClose, 
  onUpdateField, 
  descriptions, 
  vfxDescriptionTypes = [], 
  techvizDescriptionTypes = [],
  onAddDescription, 
  onRemoveDescription, 
  onToggleResolveDescription 
}: Props) {
  const [text, setText] = useState('');
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [rightTab, setRightTab] = useState<'info' | 'comments'>('comments');

  // Form states (Techviz & Common)
  const [shootingMethod, setShootingMethod] = useState(shot.shootingMethod || '');
  const [digitalHuman, setDigitalHuman] = useState(shot.digitalHuman || '');
  const [digitalHumanDays, setDigitalHumanDays] = useState(shot.digitalHumanDays || 0);
  const [techvizNotes, setTechvizNotes] = useState(shot.techvizNotes || '');
  const [techvizNotesDays, setTechvizNotesDays] = useState(shot.techvizNotesDays || 0);
  const [vfxNotes, setVfxNotes] = useState(shot.vfxNotes || '');
  const [vfxNotesDays, setVfxNotesDays] = useState(shot.vfxNotesDays || 0);
  const [progress, setProgress] = useState(shot.progress || '');
  const [techvizDrawingNo, setTechvizDrawingNo] = useState(shot.techvizDrawingNo || '');
  const [sceneName, setSceneName] = useState(shot.sceneName || '');
  const [timelineName, setTimelineName] = useState(shot.timelineName || '');

  // Form states (VFX Specific)
  const [level, setLevel] = useState(shot.production.level || 'B');
  const [type, setType] = useState(shot.production.type || '预演');
  const [status, setStatus] = useState(shot.production.status || '待分配');
  const [assignedUserId, setAssignedUserId] = useState(shot.production.assignedUserId || '');
  const [deadline, setDeadline] = useState(shot.production.deadline || '');

  // Graffiti (Drawing Pad) states
  const [isDoodleOpen, setIsDoodleOpen] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff2a5f'); // Neon red/pink
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasBg, setCanvasBg] = useState<'blank' | 'main' | 'start' | 'end'>('blank');
  
  // Modal lightbox for doodle preview
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const canvasHistoryRef = useRef<string[]>([]);

  const isTechviz = shot.category === 'techviz';

  const availableTypes = isTechviz 
    ? (techvizDescriptionTypes.length > 0 ? techvizDescriptionTypes : ['拍摄方式', '数字人', 'Techviz备注', '视效备注', '相机运动', '镜头焦距', '相机高度', '设备轨长', '机械臂控制', '安全间距', '绿幕规格', '备注'])
    : (vfxDescriptionTypes.length > 0 ? vfxDescriptionTypes : ['数字场景', '数字盗掘', '动画', '环境特效', '角色特效', '灯光氛围', '灯光渲染', 'ai制作', '合成', '备注']);

  const [selectedType, setSelectedType] = useState(availableTypes[0] || '备注');
  const [commentFilter, setCommentFilter] = useState<string>('all');

  // Hashtag input states & handlers
  const [showHashDropdown, setShowHashDropdown] = useState(false);
  const [hashFilter, setHashFilter] = useState('');
  const [hashDropdownIndex, setHashDropdownIndex] = useState(0);

  const filteredHashTypes = useMemo(() => {
    if (!hashFilter) return availableTypes;
    return availableTypes.filter(t => t.toLowerCase().includes(hashFilter.toLowerCase()));
  }, [availableTypes, hashFilter]);

  const handleSelectCategory = (category: string) => {
    const updatedText = text.replace(/#([^\s#]*)$/, `#${category} `);
    setText(updatedText);
    setShowHashDropdown(false);
  };

  const currentShotDescriptions = descriptions.filter(d => d.shotId === shot.id);

  // Sync edit form fields when shot prop changes
  useEffect(() => {
    setShootingMethod(shot.shootingMethod || '');
    setDigitalHuman(shot.digitalHuman || '');
    setDigitalHumanDays(shot.digitalHumanDays || 0);
    setTechvizNotes(shot.techvizNotes || '');
    setTechvizNotesDays(shot.techvizNotesDays || 0);
    setVfxNotes(shot.vfxNotes || '');
    setVfxNotesDays(shot.vfxNotesDays || 0);
    setProgress(shot.progress || '');
    setTechvizDrawingNo(shot.techvizDrawingNo || '');
    setSceneName(shot.sceneName || '');
    setTimelineName(shot.timelineName || '');
    setLevel(shot.production.level || 'B');
    setType(shot.production.type || '预演');
    setStatus(shot.production.status || '待分配');
    setAssignedUserId(shot.production.assignedUserId || '');
    setDeadline(shot.production.deadline || '');
  }, [shot]);

  // Reset doodle state when opening/closing background changes
  useEffect(() => {
    if (isDoodleOpen) {
      setTimeout(() => {
        initCanvas();
      }, 50);
    }
  }, [isDoodleOpen, canvasBg]);

  const getBgImageUrl = () => {
    if (canvasBg === 'start' && shot.startThumbnailUrl) return shot.startThumbnailUrl;
    if (canvasBg === 'end' && shot.endThumbnailUrl) return shot.endThumbnailUrl;
    if (canvasBg === 'main' && shot.production.thumbnailUrl) return shot.production.thumbnailUrl;
    return '';
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution (16:9 ratio, double density for high display quality)
    canvas.width = 480;
    canvas.height = 270;

    // Fill blank background
    ctx.fillStyle = '#12131a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw reference image background if selected
    const bgUrl = getBgImageUrl();
    if (bgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Attempt to prevent tainted canvas
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Semi-transparent dark overlay for better sketch visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial state to history
        canvasHistoryRef.current = [canvas.toDataURL()];
      };
      img.src = bgUrl;
    } else {
      // Chalkboard styling lines
      ctx.strokeStyle = '#222430';
      ctx.lineWidth = 1;
      for (let i = 20; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      canvasHistoryRef.current = [canvas.toDataURL()];
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasHistoryRef.current.push(canvas.toDataURL());
    if (canvasHistoryRef.current.length > 20) {
      canvasHistoryRef.current.shift();
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasHistoryRef.current.length <= 1) return;
    
    canvasHistoryRef.current.pop(); // Remove current state
    const prevStateData = canvasHistoryRef.current[canvasHistoryRef.current.length - 1];
    
    const ctx = canvas.getContext('2d');
    if (!ctx || !prevStateData) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prevStateData;
  };

  const handleCanvasClear = () => {
    initCanvas();
  };

  // Drawing event handlers
  const getCanvasCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // For touches vs mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    isDrawingRef.current = true;
    lastXRef.current = x;
    lastYRef.current = y;
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);

    if (isEraser) {
      // Erase back to background/dark slate
      ctx.strokeStyle = '#12131a';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastXRef.current = x;
    lastYRef.current = y;
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveState();
    }
  };

  const handleAddComment = () => {
    if (!text.trim() && !isDoodleOpen) return;
    
    let doodleDataUrl = undefined;
    if (isDoodleOpen && canvasRef.current) {
      try {
        doodleDataUrl = canvasRef.current.toDataURL('image/png');
      } catch (err) {
        console.warn("Failed to extract canvas due to CORS restriction, sending text only", err);
      }
    }

    // Determine type based on hashtags inside the text
    let detectedType = '备注';
    if (availableTypes.includes('备注')) {
      detectedType = '备注';
    } else if (availableTypes.length > 0) {
      detectedType = availableTypes[0];
    }

    const hashRegex = /#([^\s#]+)/g;
    const matches = [...text.matchAll(hashRegex)];
    if (matches.length > 0) {
      for (const match of matches) {
        const matchedTag = match[1];
        const foundType = availableTypes.find(t => t.toLowerCase() === matchedTag.toLowerCase());
        if (foundType) {
          detectedType = foundType;
          break;
        }
      }
    }

    if (onAddDescription) {
      onAddDescription(shot.id, detectedType, text || (doodleDataUrl ? '🎨 附加手绘涂鸦批注' : ''), doodleDataUrl, '视效总监');
    }

    setText('');
    setIsDoodleOpen(false);
    setShowHashDropdown(false);
  };

  const handleSaveSpecs = () => {
    if (onUpdateField) {
      onUpdateField(shot.id, 'sceneName', sceneName);
      onUpdateField(shot.id, 'timelineName', timelineName);
      
      if (isTechviz) {
        onUpdateField(shot.id, 'shootingMethod', shootingMethod);
        onUpdateField(shot.id, 'digitalHuman', digitalHuman, 'digitalHumanDays', digitalHumanDays);
        onUpdateField(shot.id, 'techvizNotes', techvizNotes, 'techvizNotesDays', techvizNotesDays);
        onUpdateField(shot.id, 'vfxNotes', vfxNotes, 'vfxNotesDays', vfxNotesDays);
        onUpdateField(shot.id, 'progress', progress);
        onUpdateField(shot.id, 'techvizDrawingNo', techvizDrawingNo);
      } else {
        onUpdateField(shot.id, 'production.level', level);
        onUpdateField(shot.id, 'production.type', type);
        onUpdateField(shot.id, 'production.status', status);
        onUpdateField(shot.id, 'production.assignedUserId', assignedUserId);
        onUpdateField(shot.id, 'production.deadline', deadline);
      }
    }
    setIsEditingSpecs(false);
  };

  // Compute comment count helper
  const getTypeCount = (type: string) => {
    return currentShotDescriptions.filter(d => d.type === type).length;
  };

  // Filtered comments
  const filteredComments = commentFilter === 'all' 
    ? currentShotDescriptions 
    : currentShotDescriptions.filter(d => d.type === commentFilter);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
      <div className="bg-[#18191f] text-zinc-100 rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] border border-[#2c2f3c] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-[#282a36] bg-[#121318]/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isTechviz ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'}`}>
              {isTechviz ? 'Techviz' : '视效 VFX'}
            </span>
            <h2 className="font-bold text-sm text-white tracking-wide">{shot.name} - 综合详情</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 bg-[#1a1b23] border border-[#2c2f3c] rounded-full hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        {/* Unified Flex Container layout */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row min-h-0">
          
          {/* LEFT SIDE: Visuals + Specs (Top half) AND Graffiti/Comment Input Area (Bottom half) */}
          <div className="flex-1 flex flex-col gap-4 p-5 bg-[#0e0f12] overflow-y-auto min-h-0">
            
            {/* Box 1 (Left Top): Camera play only */}
            <div className="bg-[#14151b] p-4 rounded-xl border border-[#22242e] shrink-0 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                镜头播放
              </span>
              <div className="aspect-video w-full rounded-lg bg-[#0b0c10] border border-zinc-800 flex items-center justify-center overflow-hidden relative group">
                {shot.production.videoUrl ? (
                  <video src={shot.production.videoUrl} controls className="w-full h-full object-contain" />
                ) : shot.production.thumbnailUrl ? (
                  <img src={shot.production.thumbnailUrl} alt={shot.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center gap-1.5 p-4">
                    <Film size={26} className="text-zinc-700" />
                    <span className="text-[9px] text-zinc-600 font-mono">暂无视屏参考数据</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2 (Left Bottom): Comment Input Area (评论输入区 with collapsible drawing pad) */}
            <div className="bg-[#14151b] p-4 rounded-xl border border-[#22242e] shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#22242e] pb-1.5">
                <span className="text-xs font-bold text-fuchsia-400 flex items-center gap-1.5">
                  <Paintbrush size={14} className="animate-pulse text-fuchsia-400" />
                  评论输入区与涂鸦创作板
                </span>
                <button
                  type="button"
                  onClick={() => setIsDoodleOpen(!isDoodleOpen)}
                  className={`px-3 py-1 rounded border flex items-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                    isDoodleOpen 
                      ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300 shadow-md ring-1 ring-fuchsia-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Paintbrush size={12} />
                  <span>{isDoodleOpen ? '收起涂鸦画板' : '附加手绘涂鸦'}</span>
                </button>
              </div>

              {/* Expandable Painting Palette / Draw Canvas in spacious left area */}
              {isDoodleOpen && (
                <div className="bg-[#191a22] p-3 rounded-lg border border-fuchsia-500/10 flex flex-col md:flex-row gap-3 h-[240px] transition-all duration-300">
                  
                  {/* Left Canvas Frame */}
                  <div className="flex-1 bg-[#0b0c10] rounded border border-zinc-800/80 relative flex items-center justify-center overflow-hidden h-full">
                    <canvas 
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="max-w-full max-h-full cursor-crosshair object-contain bg-[#12131a] select-none touch-none"
                    />
                    <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-600 pointer-events-none uppercase">
                      480x270 标线图画幅
                    </div>
                  </div>

                  {/* Paint Brush controls and setup */}
                  <div className="w-full md:w-32 flex flex-col gap-2 shrink-0 text-[10px]">
                    
                    {/* Choose background */}
                    <div className="space-y-1">
                      <span className="text-zinc-500 font-bold block scale-90 origin-left uppercase">选取涂鸦底图:</span>
                      <div className="grid grid-cols-2 gap-1 font-sans">
                        <button onClick={() => setCanvasBg('blank')} className={`py-0.5 rounded border text-[9px] ${canvasBg === 'blank' ? 'bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-300' : 'bg-[#101116] border-zinc-800 text-zinc-400'}`}>空白</button>
                        {shot.production.thumbnailUrl && <button onClick={() => setCanvasBg('main')} className={`py-0.5 rounded border text-[9px] ${canvasBg === 'main' ? 'bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-300' : 'bg-[#101116] border-zinc-800 text-zinc-400'}`}>主图</button>}
                        {shot.startThumbnailUrl && <button onClick={() => setCanvasBg('start')} className={`py-0.5 rounded border text-[9px] ${canvasBg === 'start' ? 'bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-300' : 'bg-[#101116] border-zinc-800 text-zinc-400'}`}>起幅</button>}
                        {shot.endThumbnailUrl && <button onClick={() => setCanvasBg('end')} className={`py-0.5 rounded border text-[9px] ${canvasBg === 'end' ? 'bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-300' : 'bg-[#101116] border-zinc-800 text-zinc-400'}`}>落幅</button>}
                      </div>
                    </div>

                    {/* Colors list */}
                    <div className="space-y-1 mt-1">
                      <span className="text-zinc-500 font-bold block scale-90 origin-left uppercase">调色盘:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { val: '#ff2a5f', label: '红色' },
                          { val: '#ffb600', label: '黄色' },
                          { val: '#00e190', label: '绿色' },
                          { val: '#00c3ff', label: '天蓝' },
                          { val: '#ffffff', label: '白色' },
                          { val: '#e040fb', label: '粉紫' }
                        ].map(c => (
                          <button
                            key={c.val}
                            onClick={() => { setIsEraser(false); setDrawColor(c.val); }}
                            className={`w-4 h-4 rounded-full border transition-transform ${drawColor === c.val && !isEraser ? 'scale-110 border-white ring-1 ring-fuchsia-400' : 'border-zinc-800'}`}
                            style={{ backgroundColor: c.val }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Palette utility buttons */}
                    <div className="mt-auto space-y-1 border-t border-zinc-800/80 pt-2 font-semibold">
                      <button 
                        onClick={() => setIsEraser(!isEraser)}
                        className={`w-full py-0.5 rounded text-[9px] border transition-colors flex items-center justify-center gap-1 ${isEraser ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-[#101116] border-zinc-800 text-zinc-400'}`}
                      >
                        {isEraser ? '切换画笔' : '橡皮擦'}
                      </button>
                      <button 
                        onClick={handleUndo}
                        disabled={canvasHistoryRef.current.length <= 1}
                        className="w-full py-0.5 bg-[#101116] border border-zinc-800 text-zinc-400 hover:text-white rounded text-[9px] flex items-center justify-center gap-1 disabled:opacity-20"
                      >
                        撤销一步
                      </button>
                      <button 
                        onClick={handleCanvasClear}
                        className="w-full py-0.5 bg-[#101116] border border-red-950/20 text-red-400 hover:text-red-300 rounded text-[9px] flex items-center justify-center gap-1"
                      >
                        清空图层
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* Form Input fields */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium px-1">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500 font-bold">#</span> 输入 <code className="bg-[#1c1d24] text-amber-500 px-1 py-0.5 rounded">#</code> 快速关联批注类别（如: #相机运动）
                  </span>
                  <span className="text-zinc-600 text-[10px]">
                    按 Up/Down 选择，Enter 确认
                  </span>
                </div>

                <div className="flex gap-2 relative">
                  {/* Autocomplete Dropdown List */}
                  {showHashDropdown && filteredHashTypes.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-[#101116]/95 border border-[#2c2f3c] rounded-lg shadow-xl overflow-hidden z-50 backdrop-blur-md max-h-56 overflow-y-auto">
                      <div className="text-[10px] text-zinc-500 px-3.5 py-1.5 border-b border-[#1f212a] bg-[#0d0e12]/80 font-bold uppercase tracking-wider">
                        匹配的批注类别
                      </div>
                      <div className="py-1">
                        {filteredHashTypes.map((type, idx) => {
                          const count = getTypeCount(type);
                          const isSelected = idx === hashDropdownIndex;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleSelectCategory(type)}
                              className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                                isSelected 
                                  ? 'bg-amber-500 text-zinc-950 font-bold' 
                                  : 'text-zinc-300 hover:bg-[#181922] hover:text-white'
                              }`}
                            >
                              <span>#{type}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                                {count > 0 ? `${count}条批注` : '暂无'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <input
                    value={text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setText(val);
                      const match = val.match(/#([^\s#]*)$/);
                      if (match) {
                        setShowHashDropdown(true);
                        setHashFilter(match[1]);
                        setHashDropdownIndex(0);
                      } else {
                        setShowHashDropdown(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (showHashDropdown && filteredHashTypes.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHashDropdownIndex(prev => (prev + 1) % filteredHashTypes.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHashDropdownIndex(prev => (prev - 1 + filteredHashTypes.length) % filteredHashTypes.length);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSelectCategory(filteredHashTypes[hashDropdownIndex]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowHashDropdown(false);
                        }
                      } else if (e.key === 'Enter') {
                        handleAddComment();
                      }
                    }}
                    className="flex-1 bg-[#0c0d10] border border-[#22242e] rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors font-sans"
                    placeholder={isDoodleOpen ? "输入对涂鸦的文字说明(可选)并点击发送..." : "输入批注内容...输入 # 触发标签联想"}
                  />
                  <button 
                    onClick={handleAddComment} 
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2 rounded-md cursor-pointer flex items-center justify-center transition-all shrink-0 shadow-md font-bold text-xs"
                  >
                    <Send size={12} className="mr-1" /> 发送
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Tabbed Sidebar containing "镜头信息" or "评论/批注 Feed" */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#2c2f3c] flex flex-col bg-[#14151b] overflow-hidden shrink-0">
            
            {/* Header Tabs (镜头信息 tab vs 评论 tab) */}
            <div className="flex border-b border-[#282a36] bg-[#121318]/70 p-1 shrink-0">
              <button
                onClick={() => setRightTab('info')}
                className={`flex-1 py-2 text-center text-xs font-bold transition-all rounded cursor-pointer flex items-center justify-center gap-1.5 ${
                  rightTab === 'info' 
                    ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700/50' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Info size={13} />
                <span>镜头信息</span>
              </button>
              <button
                onClick={() => setRightTab('comments')}
                className={`flex-1 py-2 text-center text-xs font-bold transition-all rounded cursor-pointer flex items-center justify-center gap-1.5 ${
                  rightTab === 'comments' 
                    ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700/50' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <MessageSquare size={13} />
                <span>评论</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-red-500/10 text-red-400 border border-red-500/40 font-mono font-bold">
                  {currentShotDescriptions.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT (镜头信息 or 评论列表) */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              
              {/* TAB 1: 镜头信息 (Detailed specification review with inline edit) */}
              {rightTab === 'info' && (
                <div className="space-y-4 text-xs animate-fadeIn">
                  
                  {isEditingSpecs ? (
                    // Comprehensive inline specs editor in sidebar
                    <div className="space-y-3 bg-[#101116] p-3 rounded-lg border border-zinc-800">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">编辑镜头参数</span>
                        <span className="text-[9px] text-zinc-500 font-mono">{shot.name}</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-zinc-500 mb-0.5">场景全称</label>
                          <input 
                            type="text" 
                            value={sceneName} 
                            onChange={(e) => setSceneName(e.target.value)} 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-zinc-500 mb-0.5">时间线名称</label>
                          <input 
                            type="text" 
                            value={timelineName} 
                            onChange={(e) => setTimelineName(e.target.value)} 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs" 
                          />
                        </div>

                        {isTechviz ? (
                          <>
                            <div>
                              <label className="block text-zinc-500 mb-0.5">数字人</label>
                              <input 
                                type="text" 
                                value={digitalHuman} 
                                onChange={(e) => setDigitalHuman(e.target.value)} 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs" 
                              />
                            </div>
                            <div>
                              <label className="block text-zinc-500 mb-0.5">制作进度</label>
                              <select 
                                value={progress} 
                                onChange={(e) => setProgress(e.target.value)} 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                              >
                                <option value="">--</option>
                                <option value="已准备">已准备</option>
                                <option value="进行中">进行中</option>
                                <option value="审核中">审核中</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-zinc-500 mb-0.5">镜头等级</label>
                              <select 
                                value={level} 
                                onChange={(e) => setLevel(e.target.value as any)} 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                              >
                                <option value="S">S 极难</option>
                                <option value="A">A 困难</option>
                                <option value="B">B 中等</option>
                                <option value="C">C 简单</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-zinc-500 mb-0.5">当前制作状态</label>
                              <select 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value as any)} 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                              >
                                <option value="待分配">待分配</option>
                                <option value="制作中">制作中</option>
                                <option value="审核中">审核中</option>
                                <option value="完成">完成</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingSpecs(false)} 
                          className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-center transition-colors font-bold"
                        >
                          取消
                        </button>
                        <button 
                          type="button" 
                          onClick={handleSaveSpecs} 
                          className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded text-center transition-colors font-bold flex items-center justify-center gap-1"
                        >
                          <Save size={11} />
                          <span>保存</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Read-only details with Edit Button at top */}
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">镜头信息详情</span>
                        <button 
                          onClick={() => setIsEditingSpecs(true)}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1 cursor-pointer border border-zinc-700 transition-colors font-bold"
                        >
                          <Edit size={11} />
                          <span>编辑参数</span>
                        </button>
                      </div>

                      {/* Basic section */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block border-b border-zinc-800 pb-1">基本信息</span>
                        <div className="space-y-1.5 font-mono">
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">镜头编码:</span>
                            <span className="text-zinc-300 font-bold">{shot.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">场景全称:</span>
                            <span className="text-zinc-300">{shot.sceneName || '--'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">时间线名称:</span>
                            <span className="text-zinc-300">{shot.timelineName || '--'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">剪辑素材名:</span>
                            <span className="text-zinc-300 max-w-[160px] truncate" title={shot.clipName}>{shot.clipName || '--'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Frame range specs */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block border-b border-zinc-800 pb-1">帧数范围</span>
                        <div className="space-y-1.5 font-mono">
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">起止帧数:</span>
                            <span className="text-zinc-300">{shot.startFrame} ~ {shot.startFrame + shot.frameCount - 1} 帧</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">镜头总长度:</span>
                            <span className="text-zinc-300 font-bold text-amber-500">{shot.frameCount} 帧</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-900/40">
                            <span className="text-zinc-500">项目帧速率:</span>
                            <span className="text-zinc-300">{shot.frameRate} fps</span>
                          </div>
                        </div>
                      </div>

                      {/* Production specifications (Based on category) */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block border-b border-zinc-800 pb-1">
                          {isTechviz ? 'Techviz Previz 阶段技术说明' : '视效制作规格'}
                        </span>
                        
                        {isTechviz ? (
                          <div className="space-y-2 font-mono text-[11px]">
                            {shot.digitalHuman && (
                              <div className="bg-[#101116] p-2 rounded border border-zinc-900">
                                <span className="text-zinc-500 text-[9px] block mb-0.5">数字人 (Character):</span>
                                <span className="text-zinc-200">{shot.digitalHuman} {shot.digitalHumanDays ? `(预估：${shot.digitalHumanDays}天)` : ''}</span>
                              </div>
                            )}
                            {shot.techvizNotes && (
                              <div className="bg-[#101116] p-2 rounded border border-zinc-900">
                                <span className="text-zinc-500 text-[9px] block mb-0.5">Techviz Previz 备注:</span>
                                <span className="text-zinc-200">{shot.techvizNotes} {shot.techvizNotesDays ? `(${shot.techvizNotesDays}天)` : ''}</span>
                              </div>
                            )}
                            {shot.vfxNotes && (
                              <div className="bg-[#101116] p-2 rounded border border-zinc-900">
                                <span className="text-zinc-500 text-[9px] block mb-0.5">VFX 备注:</span>
                                <span className="text-zinc-200">{shot.vfxNotes} {shot.vfxNotesDays ? `(${shot.vfxNotesDays}天)` : ''}</span>
                              </div>
                            )}
                            {shot.techvizDrawingNo && (
                              <div className="flex justify-between py-1 border-b border-zinc-900/40">
                                <span className="text-zinc-500">图纸编号:</span>
                                <span className="text-amber-500 font-bold">{shot.techvizDrawingNo}</span>
                              </div>
                            )}
                            {shot.progress && (
                              <div className="flex justify-between py-1 border-b border-zinc-900/40">
                                <span className="text-zinc-500">进度状态:</span>
                                <span className="text-zinc-200 font-bold">{shot.progress}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5 font-mono">
                            <div className="flex justify-between py-1 border-b border-zinc-900/40">
                              <span className="text-zinc-500">镜头等级:</span>
                              <span className="text-amber-500 font-bold">{shot.production.level} 级</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-900/40">
                              <span className="text-zinc-500">镜头类型:</span>
                              <span className="text-zinc-300 font-bold">{shot.production.type}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-900/40">
                              <span className="text-zinc-500">制作分配状态:</span>
                              <span className="text-zinc-300">{shot.production.status}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-900/40">
                              <span className="text-zinc-500">负责人:</span>
                              <span className="text-zinc-300 font-bold flex items-center gap-1">
                                <User size={11} className="text-zinc-500" />
                                {shot.production.assignedUserId || '未指派'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-900/40">
                              <span className="text-zinc-500">交货截止日:</span>
                              <span className="text-zinc-400 font-bold flex items-center gap-1">
                                <Calendar size={11} className="text-zinc-500" />
                                {shot.production.deadline || '--'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Relocated Reference storyboard frames (画面参考预演层级列表) */}
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">画面参考预演层级列表</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-[#101116] p-1.5 rounded border border-zinc-900 flex flex-col gap-1 items-center">
                            <span className="text-zinc-500 text-[8px] scale-90">起幅</span>
                            {shot.startThumbnailUrl ? (
                              <img src={shot.startThumbnailUrl} className="w-full h-12 object-cover rounded" />
                            ) : (
                              <ImageIcon size={14} className="opacity-20 my-2 text-zinc-600" />
                            )}
                          </div>
                          <div className="bg-[#101116] p-1.5 rounded border border-zinc-900 flex flex-col gap-1 items-center">
                            <span className="text-zinc-500 text-[8px] scale-90">落幅</span>
                            {shot.endThumbnailUrl ? (
                              <img src={shot.endThumbnailUrl} className="w-full h-12 object-cover rounded" />
                            ) : (
                              <ImageIcon size={14} className="opacity-20 my-2 text-zinc-600" />
                            )}
                          </div>
                          <div className="bg-[#101116] p-1.5 rounded border border-zinc-900 flex flex-col gap-1 items-center">
                            <span className="text-zinc-500 text-[8px] scale-90">涉及区域</span>
                            {shot.involvedAreaUrl ? (
                              <img src={shot.involvedAreaUrl} className="w-full h-12 object-cover rounded" />
                            ) : (
                              <ImageIcon size={14} className="opacity-20 my-2 text-zinc-600" />
                            )}
                          </div>
                          <div className="bg-[#101116] p-1.5 rounded border border-zinc-900 flex flex-col gap-1 items-center">
                            <span className="text-zinc-500 text-[8px] scale-90">Techviz 图纸</span>
                            {shot.techvizDrawingUrl ? (
                              <img src={shot.techvizDrawingUrl} className="w-full h-12 object-cover rounded" />
                            ) : (
                              <ImageIcon size={14} className="opacity-20 my-2 text-zinc-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* TAB 2: 评论列表 / 批注 Feed (Comments with dynamic filters and resolved toggles) */}
              {rightTab === 'comments' && (
                <div className="space-y-3.5 animate-fadeIn">
                  
                  {/* Active Filter Pills inside commentary container */}
                  <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[#282a36] scrollbar-none text-[10px]">
                    <button 
                      onClick={() => setCommentFilter('all')}
                      className={`px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                        commentFilter === 'all' 
                          ? 'bg-fuchsia-500/20 border-fuchsia-500/60 text-fuchsia-300 font-bold' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      全部 ({currentShotDescriptions.length})
                    </button>
                    {availableTypes.map(t => {
                      const count = getTypeCount(t);
                      if (count === 0) return null; // Only show active types
                      return (
                        <button 
                          key={t}
                          onClick={() => setCommentFilter(t)}
                          className={`px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                            commentFilter === t 
                              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {t} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Comment list cards */}
                  <div className="space-y-3">
                    {filteredComments.length === 0 ? (
                      <div className="text-zinc-500 text-xs text-center py-16 flex flex-col items-center gap-2">
                        <AlertCircle size={22} className="text-zinc-700" />
                        <span>
                          {commentFilter === 'all' ? '暂无任何审核批注意见' : `暂无 "${commentFilter}" 类型的意见`}
                        </span>
                        <span className="text-[9px] text-zinc-600">在左下角撰写内容后发送提交</span>
                      </div>
                    ) : (
                      filteredComments.map((desc) => (
                        <div key={desc.id} className="bg-[#1d1f27]/90 p-3 rounded-lg text-xs border border-[#2c2f3c] group relative hover:border-zinc-700 transition-all flex flex-col gap-2">
                          
                          {/* Card top flags */}
                          <div className="flex justify-between items-center gap-2 border-b border-[#282a36]/50 pb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded-[3px] text-[9px] font-bold ${
                                desc.isResolved 
                                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/30' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {desc.type}
                              </span>
                              {desc.isResolved && (
                                <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1 py-0.1 rounded flex items-center gap-0.5 font-mono">
                                  <ShieldCheck size={8} /> 已解决
                                </span>
                              )}
                              {desc.imageUrl && (
                                <span className="text-[8px] bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 px-1 py-0.1 rounded flex items-center gap-0.5 font-mono">
                                  🎨 附图
                                </span>
                              )}
                            </div>

                            {/* Card control handlers */}
                            <div className="flex items-center gap-1 shrink-0 opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => onToggleResolveDescription && onToggleResolveDescription(desc.id)}
                                title={desc.isResolved ? "置为未解决" : "标记为已解决"}
                                className={`p-0.5 rounded hover:bg-[#282a36] transition-colors ${desc.isResolved ? 'text-green-500' : 'text-zinc-400 hover:text-green-400'}`}
                              >
                                <CheckSquare size={11} className={desc.isResolved ? "fill-green-500/10" : ""} />
                              </button>
                              <button 
                                onClick={() => onRemoveDescription && onRemoveDescription(desc.id)}
                                title="删除此条批注"
                                className="p-0.5 rounded hover:bg-[#282a36] text-zinc-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Author and Timestamp section */}
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/40 px-2 py-1 rounded">
                            <span className="font-bold text-zinc-300 flex items-center gap-1">
                              <User size={10} className="text-amber-400" />
                              {desc.author || '未指派角色'}
                            </span>
                            <span className="text-zinc-500 text-[9px] font-mono flex items-center gap-1">
                              <Clock size={9} />
                              {new Date(desc.createdAt).toLocaleDateString()} {new Date(desc.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          {/* Embedded doodle thumbnail */}
                          {desc.imageUrl && (
                            <div 
                              className="mb-1 rounded border border-zinc-800 bg-[#0d0e12] overflow-hidden relative group/doodle cursor-pointer" 
                              onClick={() => setLightboxImage(desc.imageUrl || null)}
                              title="点击放大查看大图"
                            >
                              <img src={desc.imageUrl} alt="手绘涂鸦" className="w-full max-h-[120px] object-contain mx-auto" />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/doodle:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[9px] text-white bg-zinc-950/80 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Eye size={10} /> 放大涂鸦标线图
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Plain text body */}
                          <div className={`text-zinc-300 leading-relaxed font-sans select-text break-words ${desc.isResolved ? 'line-through text-zinc-500' : ''}`}>
                            {desc.content}
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* LIGHTBOX MODAL FOR OVERSIZED GRAPHIC VIEW */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 bg-zinc-900/80 text-white p-2 rounded-full border border-zinc-700 hover:bg-zinc-800 cursor-pointer">
            <X size={20} />
          </button>
          <div className="max-w-4xl w-full bg-[#18191f] p-4 rounded-xl border border-zinc-800 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 text-xs">
              <span className="text-zinc-400 font-mono">Doodle Visual Detail (涂鸦标线底图放大)</span>
              <span className="text-zinc-600">点击黑色背景或右上角关闭</span>
            </div>
            <div className="bg-[#0b0c10] rounded-lg border border-zinc-900 overflow-hidden p-2 flex items-center justify-center">
              <img src={lightboxImage} alt="涂鸦大图" className="max-h-[72vh] object-contain max-w-full rounded" />
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={() => setLightboxImage(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-md text-xs cursor-pointer">
                关闭视图
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
