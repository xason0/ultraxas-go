import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MusicItem } from "@/components/ui/music-item";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaItem } from "@/types";

export function Music() {
  // Query for trending music
  const { data: trendingMusic, isLoading: loadingMusic } = useQuery({
    queryKey: ['/api/trending-music'],
  });

  // Query for popular playlists
  const { data: popularPlaylists, isLoading: loadingPlaylists } = useQuery({
    queryKey: ['/api/playlists'],
  });

  useEffect(() => {
    // Set page title
    document.title = "BWM XMD GO - Music";
  }, []);

  return (
    <div className="px-4 py-3">
      <h2 className="text-xl font-semibold mb-4">Trending Music</h2>
      
      {/* Music List */}
      <div className="space-y-3">
        {loadingMusic ? (
          // Skeletons for loading state
          [...Array(5)].map((_, index) => (
            <div key={`music-skeleton-${index}`} className="flex items-center bg-[#1E1E1E] rounded-lg p-2 shadow-lg">
              <Skeleton className="w-14 h-14 rounded-md" />
              <div className="ml-3 flex-1">
                <Skeleton className="w-3/4 h-4 rounded mb-1" />
                <Skeleton className="w-1/2 h-3 rounded" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>
          ))
        ) : trendingMusic && trendingMusic.length > 0 ? (
          trendingMusic.map((music: MediaItem) => (
            <MusicItem key={music.id} item={music} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No trending music available</p>
          </div>
        )}
      </div>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">Popular Playlists</h2>
      
      {/* Playlists Grid */}
      <div className="grid grid-cols-2 gap-4">
        {loadingPlaylists ? (
          // Skeletons for loading state
          [...Array(2)].map((_, index) => (
            <div key={`playlist-skeleton-${index}`} className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg">
              <Skeleton className="w-full aspect-square" />
              <div className="p-3">
                <Skeleton className="w-3/4 h-4 rounded mb-1" />
                <Skeleton className="w-1/2 h-3 rounded" />
              </div>
            </div>
          ))
        ) : popularPlaylists && popularPlaylists.length > 0 ? (
          popularPlaylists.map((playlist: any) => (
            <div key={playlist.id} className="bg-[#1E1E1E] rounded-lg overflow-hidden shadow-lg">
              <img 
                src={playlist.thumbnail} 
                alt={`${playlist.title} cover`} 
                className="w-full aspect-square object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium text-white text-sm">{playlist.title}</h3>
                <p className="text-xs text-gray-400">{playlist.trackCount} tracks</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 col-span-2">
            <p>No playlists available</p>
          </div>
        )}
      </div>
    </div>
  );
}
