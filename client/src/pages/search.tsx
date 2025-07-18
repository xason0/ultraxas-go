import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/ui/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaItem } from "@/types";

interface SearchProps {
  query: string;
}

export function Search({ query: initialQuery }: SearchProps) {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(useSearch());
  const urlQuery = params.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(urlQuery || initialQuery);

  // Effect to update searchQuery when URL changes
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    } else if (initialQuery && !urlQuery) {
      setLocation(`/search?q=${encodeURIComponent(initialQuery)}`);
    }
  }, [urlQuery, initialQuery, setLocation]);

  // Query for search results
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery,
  });

  const handleCloseSearch = () => {
    // Navigate back to home
    setLocation("/");
  };

  const handleSearch = () => {
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    // Set page title
    document.title = `BWM XMD GO - Search: ${searchQuery}`;
  }, [searchQuery]);

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            Results for "{searchQuery}"
          </h2>
          <Button 
            onClick={handleSearch}
            variant="outline"
            className="ml-2"
          >
            Search
          </Button>
        </div>
        <Button
          onClick={handleCloseSearch}
          variant="ghost"
          size="icon"
          className="text-gray-400"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Search Results */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          // Skeletons for loading state
          [...Array(4)].map((_, index) => (
            <div key={`search-skeleton-${index}`} className="mb-4">
              <Skeleton className="w-full h-48 rounded-lg mb-2" />
              <Skeleton className="w-3/4 h-5 rounded mb-2" />
              <Skeleton className="w-1/2 h-4 rounded mb-2" />
              <div className="flex justify-between">
                <Skeleton className="w-28 h-8 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-gray-600 mb-4">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-400 text-center">Error searching for videos</p>
            <p className="text-gray-500 text-center text-sm mt-2">Please try again with different keywords</p>
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          searchResults.map((result: MediaItem) => (
            <MediaCard key={result.id} item={result} />
          ))
        ) : (
          <div className="py-10 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-gray-600 mb-4">
              <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 4.5a4.125 4.125 0 102.338 7.524l2.007 2.006a.75.75 0 101.06-1.06l-2.006-2.007a4.125 4.125 0 00-3.399-6.463z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-400 text-center">No results found</p>
            <p className="text-gray-500 text-center text-sm mt-2">Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
