import { useEffect, useState } from "react";
import { Download, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadItem } from "@/components/ui/download-item";
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { DownloadItem as DownloadItemType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { MediaContext } from "@/lib/context";

export function Downloads() {
  const { toast } = useToast();
  const { setCurrentMedia, setShowPlayerModal } = useContext(MediaContext);
  const [downloads, setDownloads] = useState<DownloadItemType[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set page title
    document.title = "BWM XMD GO - Downloads";
    
    // Load downloads from local storage
    const storedDownloads = getFromLocalStorage<DownloadItemType[]>("downloads", []);
    setDownloads(storedDownloads);
    setIsLoading(false);
  }, []);

  const filteredDownloads = downloads.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const handleDeleteDownload = (id: string) => {
    const updatedDownloads = downloads.filter(item => item.id !== id);
    setDownloads(updatedDownloads);
    saveToLocalStorage("downloads", updatedDownloads);
    
    toast({
      title: "Download Deleted",
      description: "The download has been removed from your list.",
    });
  };

  const handleClearAllDownloads = () => {
    setDownloads([]);
    saveToLocalStorage("downloads", []);
    
    toast({
      title: "Downloads Cleared",
      description: "All downloads have been removed.",
    });
  };

  const handlePlayDownload = (item: DownloadItemType) => {
    setCurrentMedia({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      author: item.author,
      type: item.type,
    });
    setShowPlayerModal(true);
  };

  return (
    <div className="px-4 py-3">
      <h2 className="text-xl font-semibold mb-4">Your Downloads</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Download className="h-16 w-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-center">No downloads yet</p>
          <p className="text-gray-500 text-center text-sm mt-2">
            Downloaded videos and music will appear here
          </p>
        </div>
      ) : (
        <>
          {/* Tab filters */}
          <div className="flex border-b border-gray-700 mb-4">
            <Button
              onClick={() => setActiveFilter('all')}
              variant="ghost"
              className={`py-2 px-4 h-auto rounded-none text-sm font-medium ${
                activeFilter === 'all' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-gray-400'
              }`}
            >
              All
            </Button>
            <Button
              onClick={() => setActiveFilter('video')}
              variant="ghost"
              className={`py-2 px-4 h-auto rounded-none text-sm font-medium ${
                activeFilter === 'video' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-gray-400'
              }`}
            >
              Videos
            </Button>
            <Button
              onClick={() => setActiveFilter('audio')}
              variant="ghost"
              className={`py-2 px-4 h-auto rounded-none text-sm font-medium ${
                activeFilter === 'audio' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-gray-400'
              }`}
            >
              Music
            </Button>
          </div>
          
          {/* Downloads List */}
          <div>
            {filteredDownloads.length > 0 ? (
              filteredDownloads.map(item => (
                <DownloadItem 
                  key={item.id} 
                  item={item} 
                  onDelete={handleDeleteDownload}
                  onPlay={handlePlayDownload}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No {activeFilter !== 'all' ? activeFilter : ''} downloads found</p>
              </div>
            )}
          </div>
          
          {downloads.length > 0 && (
            <Button
              onClick={handleClearAllDownloads}
              variant="ghost"
              className="mt-6 text-accent text-sm flex items-center"
            >
              <Trash className="h-4 w-4 mr-1" />
              <span>Clear All Downloads</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
