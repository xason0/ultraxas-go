import { createContext } from 'react';
import { MediaContextType } from '@/types';

export const MediaContext = createContext<MediaContextType>({
  currentMedia: null,
  setCurrentMedia: () => {},
  showPlayerModal: false,
  setShowPlayerModal: () => {},
  showDownloadModal: false,
  setShowDownloadModal: () => {},
});
