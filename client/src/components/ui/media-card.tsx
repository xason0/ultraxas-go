import { useContext } from "react";
import { Download, Video, Music, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaContext } from "@/lib/context";
import { MediaItem } from "@/types";

interface MediaCardProps {
  item: MediaItem;
  size?: "small" | "large";
}

export function MediaCard({ item, size = "large" }: MediaCardProps) {
  const { setCurrentMedia, setShowPlayerModal, setShowDownloadModal } = useContext(MediaContext);
  
  const handlePlayVideoClick = () => {
    setCurrentMedia({...item, type: 'video'});
    setShowPlayerModal(true);
  };
  
  const handlePlayAudioClick = () => {
    setCurrentMedia({...item, type: 'audio'});
    setShowPlayerModal(true);
  };
  
  const handleDownloadVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMedia({...item, type: 'video'});
    setShowDownloadModal(true);
  };
  
  const handleDownloadAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMedia({...item, type: 'audio'});
    setShowDownloadModal(true);
  };
  
  if (size === "small") {
    return (
      <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
        <div className="relative">
          <img 
            src={item.thumbnail} 
            alt={`${item.title} thumbnail`} 
            className="w-full h-28 object-cover"
          />
          {item.duration && (
            <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
              {item.duration}
            </span>
          )}
        </div>
        <div className="p-2">
          <h3 className="font-medium text-white text-sm truncate">{item.title}</h3>
          <p className="text-xs text-gray-400 truncate">{item.author} • {item.views}</p>
          <div className="flex gap-1 mt-2">
            <Button 
              onClick={handlePlayVideoClick}
              className="flex-1 flex items-center justify-center gap-1 text-white bg-primary hover:bg-primary/80 py-1 px-2 h-7 rounded-full text-xs"
            >
              <Video className="h-3 w-3" />
              <span>Play</span>
            </Button>
            <Button 
              onClick={(e) => handleDownloadVideoClick(e)}
              className="flex-1 flex items-center justify-center gap-1 text-white bg-accent hover:bg-accent/80 py-1 px-2 h-7 rounded-full text-xs"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl w-full">
      {/* Fixed aspect ratio with proper object-fit */}
      <div className="relative aspect-video w-full">
        <img 
          src={item.thumbnail} 
          alt={`${item.title} thumbnail`} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
          <Button
            onClick={handlePlayVideoClick}
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-60 rounded-full p-3 text-white hover:bg-opacity-80 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
        {item.duration && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
            {item.duration}
          </span>
        )}
      </div>
      
      {/* Content with compact sizing */}
      <div className="p-3">
        <h3 className="font-medium text-white line-clamp-2 text-sm mb-1">{item.title}</h3>
        <p className="text-xs text-gray-400 truncate mb-3">{item.author} • {item.views}</p>
        
        {/* Compact button grid */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePlayVideoClick}
            className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/80 text-white py-1.5 px-2 h-8 rounded-lg text-xs"
          >
            <Video className="h-3 w-3" />
            <span>Play</span>
          </Button>
          
          <Button
            onClick={handlePlayAudioClick}
            className="flex items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-primary text-white py-1.5 px-2 h-8 rounded-lg text-xs"
          >
            <Headphones className="h-3 w-3" />
            <span>Audio</span>
          </Button>
          
          <Button
            onClick={(e) => handleDownloadVideoClick(e)}
            className="flex items-center justify-center gap-1 bg-accent hover:bg-accent/80 text-white py-1.5 px-2 h-8 rounded-lg text-xs"
          >
            <Download className="h-3 w-3" />
            <span>Video</span>
          </Button>
          
          <Button
            onClick={(e) => handleDownloadAudioClick(e)}
            className="flex items-center justify-center gap-1 bg-accent/80 hover:bg-accent text-white py-1.5 px-2 h-8 rounded-lg text-xs"
          >
            <Download className="h-3 w-3" />
            <span>Audio</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// MediaGrid component - optimized for proper width arrangement
export function MediaGrid({ items }: { items: MediaItem[] }) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Responsive grid that properly arranges cards across full width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// Recommended Videos Component - now using same card style as main videos
export function RecommendedVideos({ items }: { items: MediaItem[] }) {
  return (
    <div className="bg-[#0f0f0f] py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Recommended Videos</h2>
        
        {/* Same grid layout as main videos for consistency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6">
          {items.map((item) => (
            <MediaCard key={`rec-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// More Videos Section (for additional content at the end)
export function MoreVideos({ items }: { items: MediaItem[] }) {
  return (
    <div className="bg-[#0f0f0f] py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">More Videos</h2>
        
        {/* Same consistent grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6">
          {items.map((item) => (
            <MediaCard key={`more-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Example usage in a page component
export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MediaItem[]>([]);
  const [moreItems, setMoreItems] = useState<MediaItem[]>([]);
  
  useEffect(() => {
    // Fetch media items from API
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media');
        const data = await response.json();
        setMediaItems(data);
        
        // Set recommended videos
        const recResponse = await fetch('/api/recommended');
        const recData = await recResponse.json();
        setRecommendedItems(recData);
        
        // Set more videos
        const moreResponse = await fetch('/api/more');
        const moreData = await moreResponse.json();
        setMoreItems(moreData);
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };
    
    fetchMedia();
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="bg-black py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Media Library</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Downloads
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        {/* Main video grid */}
        <section>
          <MediaGrid items={mediaItems} />
        </section>
        
        {/* Recommended videos section */}
        <section>
          <RecommendedVideos items={recommendedItems} />
        </section>
        
        {/* More videos section at the end */}
        <section>
          <MoreVideos items={moreItems} />
        </section>
      </main>
      
      {/* Media Player Modal would be rendered here via context */}
    </div>
  );
}
