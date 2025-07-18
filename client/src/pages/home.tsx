import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MediaCard } from "@/components/ui/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaItem } from "@/types";

export function Home() {
  // Query for trending videos
  const { data: trendingVideos, isLoading: loadingTrending } = useQuery({
    queryKey: ['/api/trending'],
  });

  // Query for recommended videos
  const { data: recommendedVideos, isLoading: loadingRecommended } = useQuery({
    queryKey: ['/api/recommended'],
  });

  useEffect(() => {
    // Set page title
    document.title = "ULTRAXAS";
  }, []);

  return (
    <div className="px-4 py-3 max-w-7xl mx-auto">
      {/* Hero Section - Trending Videos */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-5 pb-2 border-b border-gray-200 dark:border-gray-800">Trending Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loadingTrending ? (
            [...Array(4)].map((_, index) => (
              <div key={`trending-skeleton-${index}`} className="flex flex-col">
                <Skeleton className="w-full aspect-video rounded-xl mb-3" />
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="w-full h-5 rounded mb-2" />
                    <Skeleton className="w-3/4 h-4 rounded mb-1" />
                    <Skeleton className="w-1/2 h-4 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : trendingVideos && trendingVideos.length > 0 ? (
            trendingVideos.map((video: MediaItem) => (
              <MediaCard key={video.id} item={video} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No trending videos available</p>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Videos Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-5 pb-2 border-b border-gray-200 dark:border-gray-800">Recommended For You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loadingRecommended ? (
            [...Array(10)].map((_, index) => (
              <div key={`recommended-skeleton-${index}`} className="flex flex-col">
                <Skeleton className="w-full aspect-video rounded-xl mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-full mt-1" />
                  <div>
                    <Skeleton className="w-full h-4 rounded mb-2" />
                    <Skeleton className="w-3/4 h-3 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : recommendedVideos && recommendedVideos.length > 0 ? (
            recommendedVideos.map((video: MediaItem) => (
              <MediaCard key={video.id} item={video} size="small" />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No recommended videos available</p>
            </div>
          )}
        </div>
      </section>

      {/* Channel Suggestions */}
      <section>
        <h2 className="text-2xl font-bold mb-5 pb-2 border-b border-gray-200 dark:border-gray-800">Popular Channels</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`channel-${index}`} className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <Skeleton className="w-20 h-20 rounded-full mb-3" />
              <Skeleton className="w-24 h-4 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
