import { useContext } from "react";
import { Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaContext } from "@/lib/context";
import { MediaItem } from "@/types";

interface MusicItemProps {
  item: MediaItem;
}

export function MusicItem({ item }: MusicItemProps) {
  const { setCurrentMedia, setShowPlayerModal, setShowDownloadModal } = useContext(MediaContext);
  
  const handlePlayClick = () => {
    setCurrentMedia({...item, type: 'audio'});
    setShowPlayerModal(true);
  };
  
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMedia({...item, type: 'audio'});
    setShowDownloadModal(true);
  };
  
  return (
    <div className="flex items-center bg-[#1E1E1E] rounded-lg p-2 shadow-lg mb-3">
      <img 
        src={item.thumbnail} 
        alt={`${item.title} thumbnail`} 
        className="w-14 h-14 rounded-md object-cover"
      />
      <div className="ml-3 flex-1">
        <h3 className="font-medium text-white text-sm">{item.title}</h3>
        <p className="text-xs text-gray-400">{item.author}</p>
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={handlePlayClick}
          className="text-white bg-[#272727] hover:bg-[#333] rounded-full p-0 w-8 h-8"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDownloadClick}
          variant="ghost"
          className="text-accent p-0 w-8 h-8 rounded-full"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
