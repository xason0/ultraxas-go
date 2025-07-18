export interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  author?: string;
  views?: string;
  url?: string;
  type: 'video' | 'audio';
}

export interface VideoDetails {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  views: string;
  url: string;
}

export interface VideoFormat {
  quality: string;
  format: string;
  size?: string;
}

export interface DownloadOptions {
  mediaId: string;
  formats: VideoFormat[];
  title: string;
  thumbnail: string;
}

export interface DownloadItem extends MediaItem {
  downloadedAt: string;
  fileSize: string;
  quality: string;
  format: string;
  filePath: string;
}

export interface UrlVideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: {
    name: string;
  };
  views: number;
}

export interface SearchResults {
  data: SearchResult[];
  loading: boolean;
  error: string | null;
}

export interface MediaContextType {
  currentMedia: MediaItem | null;
  setCurrentMedia: (media: MediaItem | null) => void;
  showPlayerModal: boolean;
  setShowPlayerModal: (show: boolean) => void;
  showDownloadModal: boolean;
  setShowDownloadModal: (show: boolean) => void;
}
