import { useState, useContext } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaContext } from "@/lib/context";
import { isValidYoutubeUrl, getVideoId } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UrlModal({ isOpen, onClose }: UrlModalProps) {
  const { toast } = useToast();
  const { setCurrentMedia, setShowDownloadModal } = useContext(MediaContext);
  const [url, setUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Fetch video info
  const { data: videoInfo, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/video-info/${videoId}`],
    enabled: !!videoId,
  });

  // Mutation for URL submit
  const urlMutation = useMutation({
    mutationFn: async (url: string) => {
      const extractedId = getVideoId(url);
      if (!extractedId) {
        throw new Error("Invalid YouTube URL");
      }
      setVideoId(extractedId);
      return { id: extractedId };
    },
    onError: (error) => {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
    }
  });

  const handleFetchUrl = () => {
    if (!url.trim()) return;
    
    if (!isValidYoutubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }
    
    urlMutation.mutate(url);
  };

  const handleDownloadOptions = () => {
    if (!videoInfo) return;
    
    setCurrentMedia({
      id: videoInfo.id,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      type: 'video',
    });
    
    setShowDownloadModal(true);
    onClose();
    setUrl("");
    setVideoId(null);
  };

  const resetModal = () => {
    setUrl("");
    setVideoId(null);
    setShowOptions(false);
    onClose();
  };

  const openSocialMediaDownloader = () => {
    window.open("coming soonn by ultraxas", "_blank");
  };

  if (!showOptions) {
    return (
      <div className={`modal-container ${isOpen ? "active" : ""}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Download from URL</h3>
            <Button
              onClick={resetModal}
              variant="ghost"
              size="icon"
              className="text-gray-400"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowOptions(true)}
              className="w-full py-4 text-center bg-primary rounded-lg text-white font-medium"
            >
              Download audio&video from youtube url
            </Button>
            
            <Button
              onClick={openSocialMediaDownloader}
              className="w-full py-4 text-center bg-secondary rounded-lg text-white font-medium"
            >
              Download video from any social media url
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal-container ${isOpen ? "active" : ""}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Download from URL</h3>
          <Button
            onClick={resetModal}
            variant="ghost"
            size="icon"
            className="text-gray-400"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="url-input" className="text-sm text-gray-400 block mb-2">
            Paste YouTube URL
          </label>
          <Input
            id="url-input"
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-[#272727] text-white placeholder-gray-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        
        <Button
          onClick={handleFetchUrl}
          disabled={isLoading || urlMutation.isPending}
          className="w-full py-3 text-center bg-primary rounded-lg text-white font-medium mb-3"
        >
          {isLoading || urlMutation.isPending ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Fetching...
            </span>
          ) : (
            "Fetch Video"
          )}
        </Button>
        
        {/* Video Preview */}
        {videoInfo && !isLoading && !error && (
          <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg mb-4">
            <div className="p-3 flex items-start">
              <img 
                src={videoInfo.thumbnail} 
                alt="Video thumbnail" 
                className="w-20 h-20 rounded-md object-cover" 
              />
              <div className="ml-3 flex-1">
                <h3 className="font-medium text-white text-sm">{videoInfo.title}</h3>
                <Button
                  onClick={handleDownloadOptions}
                  className="mt-3 flex items-center gap-1 text-accent bg-[#272727] hover:bg-[#333] py-1.5 px-3 rounded-full text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    <path d="M5.25 18.75a1.5 1.5 0 00-1.5 1.5v.75h16.5v-.75a1.5 1.5 0 00-1.5-1.5h-13.5z" />
                  </svg>
                  <span>Download Options</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            <p className="mt-3 text-gray-400 text-sm">Fetching video info...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="py-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-destructive mx-auto mb-2">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-destructive text-sm">Invalid URL or video not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
