import { BaseShot, ProductionData, DescriptionEntry, DrawingVersion } from './types';

function generateRandomString(length: number) {
  return Math.random().toString(36).substring(2, 2 + length);
}

const DRAWING_IMAGE_PRESETS = [
  { name: '机位平面俯视动线图', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=800&fit=crop', desc: 'A/B双机位轨道动线' },
  { name: '机械臂避障与安全包络', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&h=800&fit=crop', desc: '标明极限伸展半径3.1米' },
  { name: '灯光矩阵与色温标定', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&h=800&fit=crop', desc: '天幕LED 5600K 补光' },
  { name: '绿幕规格与追踪点位分布', url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&h=800&fit=crop', desc: '十字Mark点间距50cm' },
  { name: '3D相机轨迹空间标定图', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop', desc: 'Maya空间坐标与实拍对齐' },
  { name: '站台置景标高立面图', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=800&fit=crop', desc: '站台高度1.15m结构线' }
];

function generateDrawingVersions(shotIndex: number, primaryUrl?: string): DrawingVersion[] | undefined {
  if (!primaryUrl && shotIndex % 2 !== 0) return undefined;
  
  const v1Images = [
    {
      id: `img_${shotIndex}_v1_1`,
      url: primaryUrl || DRAWING_IMAGE_PRESETS[shotIndex % DRAWING_IMAGE_PRESETS.length].url,
      name: primaryUrl ? '初始工程图纸' : DRAWING_IMAGE_PRESETS[shotIndex % DRAWING_IMAGE_PRESETS.length].name,
      uploadedAt: '2026-07-10',
      description: '初版机位与空间规划'
    },
    {
      id: `img_${shotIndex}_v1_2`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 1) % DRAWING_IMAGE_PRESETS.length].url,
      name: DRAWING_IMAGE_PRESETS[(shotIndex + 1) % DRAWING_IMAGE_PRESETS.length].name,
      uploadedAt: '2026-07-10',
      description: '空间结构立面图'
    }
  ];

  const v2Images = [
    {
      id: `img_${shotIndex}_v2_1`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 2) % DRAWING_IMAGE_PRESETS.length].url,
      name: DRAWING_IMAGE_PRESETS[(shotIndex + 2) % DRAWING_IMAGE_PRESETS.length].name,
      uploadedAt: '2026-07-20',
      description: '优化后机械臂路径'
    },
    {
      id: `img_${shotIndex}_v2_2`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 3) % DRAWING_IMAGE_PRESETS.length].url,
      name: DRAWING_IMAGE_PRESETS[(shotIndex + 3) % DRAWING_IMAGE_PRESETS.length].name,
      uploadedAt: '2026-07-20',
      description: '绿幕包络与标定点'
    },
    {
      id: `img_${shotIndex}_v2_3`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 4) % DRAWING_IMAGE_PRESETS.length].url,
      name: DRAWING_IMAGE_PRESETS[(shotIndex + 4) % DRAWING_IMAGE_PRESETS.length].name,
      uploadedAt: '2026-07-21',
      description: '灯光矩阵布局'
    }
  ];

  const v3Images = [
    {
      id: `img_${shotIndex}_v3_1`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 4) % DRAWING_IMAGE_PRESETS.length].url,
      name: '终版实拍工程图纸',
      uploadedAt: '2026-08-01',
      description: '现场复核终版'
    },
    {
      id: `img_${shotIndex}_v3_2`,
      url: DRAWING_IMAGE_PRESETS[(shotIndex + 5) % DRAWING_IMAGE_PRESETS.length].url,
      name: '机位安全距离复核图',
      uploadedAt: '2026-08-01',
      description: '导演与总监签字确认'
    }
  ];

  const hasV3 = shotIndex % 2 === 0;

  const versions: DrawingVersion[] = [
    {
      version: 'V1',
      name: '初版工程规划',
      createdAt: '2026-07-10 14:00',
      author: '张工 (Techviz)',
      description: '机位与场景基础尺寸标定',
      images: v1Images
    },
    {
      version: 'V2',
      name: '机械臂与绿幕优化版',
      createdAt: '2026-07-20 16:30',
      author: '李工 (工程部)',
      description: '调整了机械臂安全旋转半径，增加了绿幕追踪点位',
      images: v2Images
    }
  ];

  if (hasV3) {
    versions.push({
      version: 'V3',
      name: '终版执行工程图',
      createdAt: '2026-08-01 11:20',
      author: '王总监',
      description: '现场复核确认版，直接交付实拍',
      images: v3Images
    });
  }

  return versions;
}

const VFX_SHOT_NAMES = ['A', 'B', 'C', 'D'].flatMap(scene => 
  Array.from({length: 10}, (_, i) => `${scene}_${String(i+1).padStart(3, '0')}`)
);

export function generateMockData(count: number) {
  // 1. Generate VFX shots
  const vfxShots = Array.from({ length: 30 }, (_, i) => {
    const name = VFX_SHOT_NAMES[i % VFX_SHOT_NAMES.length];
    const vendors = ["维塔数码 (Weta)", "光影魔幻 (ILM)", "原力动画", "数字王国 (DD)", "BASE FX"];
    const artists = ["张伟", "李娜", "王强", "刘洋", "陈静"];
    const drawings = generateDrawingVersions(i);
    return {
      id: `vfx_shot_${i}`,
      projectId: 'proj_001',
      name: `${name}_v${Math.floor(Math.random() * 5) + 1}`,
      clipName: `clip_${generateRandomString(5)}`,
      sceneName: name.split('_')[0],
      timelineName: 'tl_main_01',
      track: 1,
      frameRate: 24,
      startFrame: 1001,
      frameCount: 120,
      startTimecode: '01:00:00:00',
      relativeMediaStartTime: '00:00:00:00',
      mediaId: `media_${generateRandomString(8)}`,
      edlVersionId: 'v1',
      category: 'vfx' as const,
      // Multi-version & multi-image engineering drawings
      engineeringDrawings: drawings,
      selectedDrawingVersion: drawings ? drawings[drawings.length - 1].version : undefined,
      // Seeded custom fields
      custom_vendor: vendors[i % vendors.length],
      custom_renderTime: (i % 3 === 0) ? Math.floor(Math.random() * 40) + 5 : undefined,
      custom_onlineDate: `2026-07-${String((i % 15) + 10).padStart(2, '0')}`,
      custom_compArtist: artists[i % artists.length],
      production: {
        level: ['S', 'A', 'B', 'C', 'D'][Math.floor(Math.random() * 5)] as any,
        type: ['实拍', '第三方', '预演'][Math.floor(Math.random() * 3)] as any,
        status: ['待分配', '制作中', '审核中', '完成'][Math.floor(Math.random() * 4)] as any,
        assignedUserId: `vfx_artist_${Math.floor(Math.random() * 5) + 1}`,
        deadline: new Date(Date.now() + Math.random() * 10 * 86400000).toISOString().split('T')[0],
        thumbnailUrl: `https://picsum.photos/seed/vfx${i}/200/150`,
        videoUrl: `https://www.w3schools.com/html/mov_bbb.mp4`
      }
    };
  });

  // 2. Generate Techviz shots based EXACTLY on the uploaded screenshot
  const techvizSpecs = [
    {
      name: 'e01_s001_c009',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?w=200&h=150&fit=crop',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&h=150&fit=crop',
      involvedAreaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=150&fit=crop',
      techvizDrawingUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e01_s001_c026',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '远镜头拍摄',
      digitalHuman: '是你茶馆航太烈火公司给阿哥不加价再发个FT',
      digitalHumanDays: 2,
      techvizNotes: '1图-1',
      techvizNotesDays: 2,
      vfxNotes: '888',
      vfxNotesDays: 4,
      progress: ''
    },
    {
      name: 'e01_s001_c028',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=150&fit=crop',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e01_s001_c056',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '方法热风热饭热风人非人肥肉肥肉胆胆\nv地方v发单v地\n方v地方v的v地\n方',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: '已准备'
    },
    {
      name: 'e01_s001_c056a',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: 'vv地方v',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e01_s001_c056c',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=150&fit=crop',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e01_s001_c058',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&h=150&fit=crop',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '111',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e01_s001_c066',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=150&fit=crop',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '666666666666666',
      vfxNotesDays: 1,
      progress: ''
    },
    {
      name: 'e01_s001_c056e',
      sceneName: '测试地铁站',
      timelineName: 'Tev_测试地铁站',
      startThumbnailUrl: '',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e16_s003_c018',
      sceneName: '测试草原',
      timelineName: 'Tev_测试草原',
      startThumbnailUrl: '',
      videoUrl: '', // No video
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e16_s003_c018a',
      sceneName: '测试草原',
      timelineName: 'Tev_测试草原',
      startThumbnailUrl: '',
      videoUrl: '',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e16_s003_c018b',
      sceneName: '测试草原',
      timelineName: 'Tev_测试草原',
      startThumbnailUrl: '',
      videoUrl: '',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e16_s003_c019',
      sceneName: '测试草原',
      timelineName: 'Tev_测试草原',
      startThumbnailUrl: '',
      videoUrl: '',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    },
    {
      name: 'e16_s003_c019a',
      sceneName: '测试草原',
      timelineName: 'Tev_测试草原',
      startThumbnailUrl: '',
      videoUrl: '',
      endThumbnailUrl: '',
      involvedAreaUrl: '',
      techvizDrawingUrl: '',
      techvizDrawingNo: '',
      shootingMethod: '',
      digitalHuman: '',
      techvizNotes: '',
      vfxNotes: '',
      progress: ''
    }
  ];

  const techvizShots: BaseShot[] = techvizSpecs.map((spec, i) => {
    const cameras = ["ARRI Alexa LF", "RED V-RAPTOR", "Sony Venice 2", "RED KOMODO"];
    const drawings = generateDrawingVersions(i, spec.techvizDrawingUrl);
    return {
      id: `techviz_shot_${i}`,
      projectId: 'proj_001',
      name: spec.name,
      clipName: `clip_tech_${generateRandomString(4)}`,
      sceneName: spec.sceneName,
      timelineName: spec.timelineName,
      track: 1,
      frameRate: 24,
      startFrame: 1001,
      frameCount: 150,
      startTimecode: '01:00:00:00',
      relativeMediaStartTime: '00:00:00:00',
      mediaId: `media_tech_${generateRandomString(8)}`,
      edlVersionId: 'v1',
      category: 'techviz' as const,
      
      // Multi-version & multi-image engineering drawings
      engineeringDrawings: drawings,
      selectedDrawingVersion: drawings ? drawings[drawings.length - 1].version : undefined,

      // Spec fields
      startThumbnailUrl: spec.startThumbnailUrl || undefined,
      endThumbnailUrl: spec.endThumbnailUrl || undefined,
      involvedAreaUrl: spec.involvedAreaUrl || undefined,
      techvizDrawingUrl: spec.techvizDrawingUrl || undefined,
      techvizDrawingNo: spec.techvizDrawingNo || undefined,
      shootingMethod: spec.shootingMethod || undefined,
      digitalHuman: spec.digitalHuman || undefined,
      digitalHumanDays: spec.digitalHumanDays || undefined,
      techvizNotes: spec.techvizNotes || undefined,
      techvizNotesDays: spec.digitalHumanDays || undefined, // match mockup
      vfxNotes: spec.vfxNotes || undefined,
      vfxNotesDays: spec.vfxNotesDays || undefined,
      progress: spec.progress || undefined,

      // Seeded custom fields
      custom_cameraModel: cameras[i % cameras.length],
      custom_hasMockup: i % 3 === 0 ? "是" : "否",
      custom_rehearsalHours: (i % 2 === 0) ? Math.floor(Math.random() * 32) + 4 : undefined,
      custom_shootDate: `2026-07-${String((i % 10) + 12).padStart(2, '0')}`,

      production: {
        level: ['S', 'A', 'B', 'C', 'D'][i % 5] as any,
        type: '预演' as const,
        status: (spec.progress === '已准备' ? '完成' : ['待分配', '制作中', '审核中'][i % 3]) as any,
        assignedUserId: `tech_engineer_${(i % 5) + 1}`,
        deadline: new Date(Date.now() + (i + 2) * 86400000).toISOString().split('T')[0],
        thumbnailUrl: spec.startThumbnailUrl || 'https://picsum.photos/seed/tech_fallback/200/150',
        videoUrl: spec.videoUrl || undefined
      }
    };
  });

  const shots = [...vfxShots, ...techvizShots];

  const vfxTypes = ['数字场景', '数字盗掘', '动画', '环境特效', '角色特效', '灯光氛围', '灯光渲染', 'ai制作', '合成', '备注'];
  const techvizTypes = ['相机运动', '镜头焦距', '相机高度', '设备轨长', '机械臂控制', '安全间距', '绿幕规格', '备注'];

  const descriptions: DescriptionEntry[] = shots.flatMap((shot, i) => {
    // Only generate some default standard comments/resolutions for non-specified ones
    if (shot.category === 'techviz') {
      const list: DescriptionEntry[] = [];
      if (shot.shootingMethod) {
        list.push({
          id: `desc_init_${shot.id}_shootingMethod`,
          shotId: shot.id,
          type: '拍摄方式',
          content: shot.shootingMethod,
          isResolved: false,
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          author: '视效总监'
        });
      }
      if (shot.digitalHuman) {
        list.push({
          id: `desc_init_${shot.id}_digitalHuman`,
          shotId: shot.id,
          type: '数字人',
          content: `${shot.digitalHuman}${shot.digitalHumanDays ? ` (工期: ${shot.digitalHumanDays}天)` : ''}`,
          isResolved: false,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          author: '视效总监'
        });
      }
      if (shot.techvizNotes) {
        list.push({
          id: `desc_init_${shot.id}_techvizNotes`,
          shotId: shot.id,
          type: 'Techviz备注',
          content: `${shot.techvizNotes}${shot.techvizNotesDays ? ` (工期: ${shot.techvizNotesDays}天)` : ''}`,
          isResolved: false,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          author: '视效总监'
        });
      }
      if (shot.vfxNotes) {
        list.push({
          id: `desc_init_${shot.id}_vfxNotes`,
          shotId: shot.id,
          type: '视效备注',
          content: `${shot.vfxNotes}${shot.vfxNotesDays ? ` (工期: ${shot.vfxNotesDays}天)` : ''}`,
          isResolved: false,
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          author: '视效总监'
        });
      }
      return list;
    }
    
    if (Math.random() > 0.4) return [];
    const numDescriptions = Math.floor(Math.random() * 2) + 1;
    const isTechviz = false;
    const activeTypes = vfxTypes;
    
    const mockAuthors = ['导演', '制片', '视效总监', '现场指导', '视效助理', '制作经理'];
    return Array.from({ length: numDescriptions }, (_, j) => {
      const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
      const content = `关于镜头 ${shot.name} 的相关意见 ${Math.floor(Math.random() * 100)}`;
      const author = mockAuthors[Math.floor(Math.random() * mockAuthors.length)];
      
      return {
        id: `desc_${i}_${j}`,
        shotId: shot.id,
        type,
        content,
        isResolved: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(), // Randomize dates a bit for realism
        author
      };
    });
  });

  return { shots, descriptions };
}
