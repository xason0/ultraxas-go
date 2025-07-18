import { useContext, useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaContext } from "@/lib/context";
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { DownloadItem } from "@/types";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export function DownloadModal() {
  const { toast } = useToast();
  const { currentMedia, showDownloadModal, setShowDownloadModal } = useContext(MediaContext);
  const [selectedQuality, setSelectedQuality] = useState<string>("720p");
  const [selectedFormat, setSelectedFormat] = useState<"audio" | "video">("video");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>("Preparing download...");
  const downloadController = useRef<AbortController | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const statusTimeout = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRY_ATTEMPTS = 5;

  // Set initial format based on media type
  useEffect(() => {
    if (currentMedia) {
      setSelectedFormat(currentMedia.type === "video" ? "video" : "audio");
      setSelectedQuality(currentMedia.type === "video" ? "720p" : "128kbps");
    }
  }, [currentMedia]);

  // Clean up intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (statusTimeout.current) {
        clearTimeout(statusTimeout.current);
      }
      if (downloadController.current) {
        downloadController.current.abort();
      }
    };
  }, []);

  const updateStatusWithDelay = (newStatus: string, delay: number = 2000) => {
    if (statusTimeout.current) {
      clearTimeout(statusTimeout.current);
    }
    statusTimeout.current = setTimeout(() => {
      setDownloadStatus(newStatus);
    }, delay);
  };

  const startProgressAnimation = () => {
    setDownloadProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Minimal progress animation just to show activity
    progressInterval.current = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 15) { // Cap at 15% until we get download URL
          return 15;
        }
        return prev + 1;
      });
    }, 300);
  };

  const extractDownloadUrl = (data: any): string | null => {
    if (!data) return null;
    return data.result?.download_url || 
       data.result?.downloadUrl || 
       data.downloadUrl || 
       data.download_url || 
       data.result?.video_url || 
       data.result?.audio_url || 
       data.video_url || 
       data.audio_url;
  };

  const triggerDownload = (url: string) => {
    // Immediately show 100% when download starts on device
    setDownloadProgress(100);
    setDownloadStatus("Download started on your device...");
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = url;
    setTimeout(() => document.body.removeChild(iframe), 10000);
  };

  const cancelDownload = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (statusTimeout.current) {
      clearTimeout(statusTimeout.current);
    }
    if (downloadController.current) {
      downloadController.current.abort();
    }
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadStatus("Download cancelled");
    setApiError('Download was cancelled by user');
  };

  const handleDownload = async () => {
    if (!currentMedia || isDownloading) return;
    
    downloadController.current = new AbortController();
    setIsDownloading(true);
    setApiError(null);
    setDownloadStatus("Preparing download...");
    startProgressAnimation();

    try {
      const videoId = currentMedia.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      const apiKey = 'ibrahimadams';
      const encodedUrl = encodeURIComponent(videoUrl);

      const apiEndpoints = selectedFormat === 'audio' ? [
  `https://apis.davidcyriltech.web.id/download/ytmp3?url=${encodedUrl}`
] : [
  `https://apis.davidcyriltech.web.id/download/ytmp4?url=${encodedUrl}`,
  `https://apis.davidcyriltech.web.id/youtube/mp4?url=${encodedUrl}`
];

      let downloadUrl = null;
      let attempts = 0;
      let lastError = null;

      // Try each API endpoint with retries
      for (const apiUrl of apiEndpoints) {
        attempts = 0;
        while (attempts < MAX_RETRY_ATTEMPTS && !downloadUrl) {
          attempts++;
          
          try {
            updateStatusWithDelay("Contacting download server...");
            
            const response = await axios.get(apiUrl, { 
              timeout: 10000,
              signal: downloadController.current?.signal
            });
            
            downloadUrl = extractDownloadUrl(response.data);
            
            if (downloadUrl) {
              // Immediately trigger download when URL is available
              setDownloadStatus("Starting download...");
              triggerDownload(downloadUrl);
              saveSuccessfulDownload();
              
              setTimeout(() => {
                setShowDownloadModal(false);
                toast({
                  title: "Download Started",
                  description: `Your ${selectedFormat === 'audio' ? 'MP3' : 'video'} is downloading`
                });
              }, 500);
              return;
            }
          } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempts} failed for ${apiUrl}`, error);
            if (attempts < MAX_RETRY_ATTEMPTS) {
              updateStatusWithDelay(`Retrying... (${attempts}/${MAX_RETRY_ATTEMPTS})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      throw lastError || new Error('Failed to prepare download after multiple attempts');
    } catch (error) {
      if (error.name !== 'AbortError') {
        setApiError('There was a problem preparing your download. Please try again later.');
        console.error('Final download error:', error);
      }
    } finally {
      if (!downloadController.current?.signal.aborted) {
        setIsDownloading(false);
      }
      downloadController.current = null;
    }
  };

  const saveSuccessfulDownload = () => {
    if (!currentMedia) return;
    
    const downloads = getFromLocalStorage<DownloadItem[]>("downloads", []);
    const newDownload: DownloadItem = {
      id: currentMedia.id,
      title: currentMedia.title,
      thumbnail: currentMedia.thumbnail,
      author: currentMedia.author || "Unknown",
      type: selectedFormat,
      downloadedAt: new Date().toISOString(),
      fileSize: selectedFormat === "audio" ? "5MB" : 
                selectedQuality === "1080p" ? "120MB" : 
                selectedQuality === "720p" ? "60MB" : "30MB",
      quality: selectedFormat === "audio" ? "128kbps" : selectedQuality,
      format: selectedFormat === "audio" ? "mp3" : "mp4",
      filePath: "Downloaded to device"
    };
    
    saveToLocalStorage("downloads", [newDownload, ...downloads].slice(0, 50));
  };

  if (!currentMedia) return null;

  return (
    <div className={`modal-container ${showDownloadModal ? "active" : ""}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Download Options</h3>
          <Button
            onClick={() => setShowDownloadModal(false)}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-gray-700"
            disabled={isDownloading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-300 truncate">{currentMedia.title}</p>
        </div>
        
        {apiError && (
          <div className="mb-4 p-3 bg-red-900/50 rounded-lg">
            <p className="text-red-300 text-sm">{apiError}</p>
          </div>
        )}
        
        {isDownloading && (
          <div className="mb-4 p-3 bg-blue-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-300 text-sm">{downloadStatus}</span>
              <span className="text-blue-300 text-sm">{Math.round(downloadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-linear" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <Button
              onClick={cancelDownload}
              className="w-full mt-2 py-1 text-center bg-red-600 rounded-lg text-white text-sm hover:bg-red-700"
            >
              Cancel Download
            </Button>
          </div>
        )}
        
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setSelectedFormat("video")}
            className={`flex-1 py-2 text-center rounded-lg text-white text-sm ${
              selectedFormat === "video" ? "bg-accent" : "bg-[#272727]"
            }`}
            disabled={isDownloading}
          >
            Video
          </Button>
          <Button
            onClick={() => setSelectedFormat("audio")}
            className={`flex-1 py-2 text-center rounded-lg text-white text-sm ${
              selectedFormat === "audio" ? "bg-accent" : "bg-[#272727]"
            }`}
            disabled={isDownloading}
          >
            MP3 (High Quality)
          </Button>
        </div>
        
        {selectedFormat === "video" && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-gray-400">Video Quality</h4>
            <div className="grid grid-cols-2 gap-2">
              {["480p", "720p", "1080p"].map(quality => (
                <Button
                  key={quality}
                  onClick={() => setSelectedQuality(quality)}
                  variant="ghost"
                  className={`py-2 text-center rounded-lg text-white text-sm ${
                    selectedQuality === quality ? "bg-accent" : "bg-[#272727]"
                  }`}
                  disabled={isDownloading}
                >
                  {quality === "1080p" ? "1080p (HD)" : quality}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3 text-center bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
        >
          {isDownloading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            `Download ${selectedFormat === 'audio' ? 'MP3' : selectedQuality}`
          )}
        </Button>
      </div>
    </div>
  );
}
