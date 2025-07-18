import { useState } from "react";
import { Play, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadItem as DownloadItemType } from "@/types";

interface DownloadItemProps {
  item: DownloadItemType;
  onDelete: (id: string) => void;
  onPlay: (item: DownloadItemType) => void;
}

export function DownloadItem({ item, onDelete, onPlay }: DownloadItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(item.id);
  };

  const handlePlay = () => {
    onPlay(item);
  };

  return (
    <div className="flex bg-[#1E1E1E] rounded-lg p-2 mb-3 shadow-lg">
      <img 
        src={item.thumbnail} 
        alt={`${item.title} thumbnail`} 
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="ml-3 flex-1">
        <h3 className="font-medium text-white text-sm">{item.title}</h3>
        <p className="text-xs text-gray-400">{item.author}</p>
        <div className="flex items-center mt-1">
          <span className="text-xs bg-[#272727] text-white px-2 py-0.5 rounded-full">
            {item.quality}
          </span>
          <span className="text-xs text-gray-500 ml-2">{item.fileSize}</span>
        </div>
      </div>
      <div className="flex flex-col space-y-2 justify-center">
        <Button
          onClick={handlePlay}
          variant="ghost"
          size="icon"
          className="text-white p-1 h-8 w-8"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-destructive p-1 h-8 w-8"
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
