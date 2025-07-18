import { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { Home } from "@/pages/home";
import { Music } from "@/pages/music";
import { Downloads } from "@/pages/downloads";
import { Search } from "@/pages/search";
import BottomNav from "@/components/layout/bottom-nav";
import Navbar from "@/components/layout/navbar";
import { DownloadModal } from "@/components/modals/download-modal";
import { UrlModal } from "@/components/modals/url-modal";
import { Player } from "@/components/ui/player";
import { MediaContext } from "@/lib/context";
import { MediaItem } from "@/types";
import NotFound from "@/pages/not-found";

function App() {
  const [activeTab, setActiveTab] = useState<string>("/");
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Handle URL modal visibility
  const handleUrlModal = () => {
    setShowUrlModal(!showUrlModal);
  };

  // Handle keyboard event listeners for search
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchActive(true);
      }
      
      // Escape to close search
      if (e.key === "Escape" && isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isSearchActive]);

  return (
    <MediaContext.Provider
      value={{
        currentMedia,
        setCurrentMedia,
        showPlayerModal,
        setShowPlayerModal,
        showDownloadModal,
        setShowDownloadModal,
      }}
    >
      <div className="min-h-screen bg-secondary">
        <Navbar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          isSearchActive={isSearchActive}
          setIsSearchActive={setIsSearchActive}
        />
        
        <main className="pt-16 pb-20">
          <Switch>
            <Route path="/">
              <Home />
            </Route>
            <Route path="/music">
              <Music />
            </Route>
            <Route path="/downloads">
              <Downloads />
            </Route>
            <Route path="/search">
              <Search query={searchQuery} />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </main>

        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onUrlButtonClick={handleUrlModal} 
        />
        
        <Player />
        <DownloadModal />
        <UrlModal 
          isOpen={showUrlModal} 
          onClose={() => setShowUrlModal(false)} 
        />
        
        {/* Footer with creator info */}
        <div className="text-center text-xs text-gray-500 py-3 mt-4">
          <p>Develop by Manasseh Amoako</p>
        </div>
      </div>
    </MediaContext.Provider>
  );
}

export default App;
