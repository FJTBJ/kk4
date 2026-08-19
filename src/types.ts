export type ShotLevel = 'S' | 'A' | 'B' | 'C' | 'D';
export type ShotStatus = '待分配' | '制作中' | '审核中' | '完成';

export interface DrawingImage {
  id: string;
  url: string;
  name: string;
  uploadedAt?: string;
  size?: string;
  description?: string;
}

export interface DrawingVersion {
  version: string;
  name?: string;
  createdAt: string;
  author: string;
  description?: string;
  images: DrawingImage[];
}

export interface BaseShot {
  id: string;
  projectId: string;
  name: string;
  clipName: string;
  sceneName: string;
  timelineName: string;
  track: number;
  frameRate: number;
  startFrame: number;
  frameCount: number;
  startTimecode: string;
  relativeMediaStartTime: string;
  mediaId: string;
  edlVersionId: string;
  category?: 'vfx' | 'techviz';
  // Techviz specific fields
  startThumbnailUrl?: string;
  endThumbnailUrl?: string;
  involvedAreaText?: string;
  involvedAreaUrl?: string;
  techvizDrawingUrl?: string;
  techvizDrawingNo?: string;
  shootingMethod?: string;
  digitalHuman?: string;
  digitalHumanDays?: number;
  techvizNotes?: string;
  techvizNotesDays?: number;
  vfxNotes?: string;
  vfxNotesDays?: number;
  progress?: string;
  // Multi-version & multi-image engineering drawings
  engineeringDrawings?: DrawingVersion[];
  selectedDrawingVersion?: string;
}

export interface ProductionData {
  level: ShotLevel;
  type: '第三方' | '预演' | '实拍';
  status: ShotStatus;
  assignedUserId?: string;
  deadline?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface DescriptionEntry {
  id: string;
  shotId: string;
  type: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
  imageUrl?: string;
  author?: string;
}

export interface Task {
  id: string;
  title: string;
  shotIds: string[];
  descriptionEntryIds: string[];
  status: '待开始' | '进行中' | '完成';
}
