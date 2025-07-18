import { useEffect } from "react";
import { Home, Music, Download, Link } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onUrlButtonClick: () => void;
}

export default function BottomNav({ activeTab, setActiveTab, onUrlButtonClick }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  
  // Sync active tab with current location
  useEffect(() => {
    setActiveTab(location);
  }, [location, setActiveTab]);
  
  // Update tab indicator position
  useEffect(() => {
    const tabIndicator = document.getElementById("tab-indicator");
    if (tabIndicator) {
      let position = 0;
      
      switch (activeTab) {
        case "/":
          position = 0;
          break;
        case "/music":
          position = 1;
          break;
        case "/downloads":
          position = 2;
          break;
        default:
          position = 0;
      }
      
      tabIndicator.style.transform = `translateX(${position * 100}%)`;
    }
  }, [activeTab]);
  
  const navigateTo = (path: string) => {
    setLocation(path);
    setActiveTab(path);
  };
  
  const isActive = (path: string) => activeTab === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-gray-800 z-30">
      <div className="flex justify-between">
        <Button
          onClick={() => navigateTo("/")}
          variant="ghost"
          className={`flex-1 flex-col items-center justify-center py-3 px-2 text-center ${
            isActive("/") ? "text-accent" : "text-gray-400"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="block text-xs mt-1">Home</span>
        </Button>
        
        <Button
          onClick={() => navigateTo("/music")}
          variant="ghost"
          className={`flex-1 flex-col items-center justify-center py-3 px-2 text-center ${
            isActive("/music") ? "text-accent" : "text-gray-400"
          }`}
        >
          <Music className="h-5 w-5" />
          <span className="block text-xs mt-1">Music</span>
        </Button>
        
        <Button
          onClick={() => navigateTo("/downloads")}
          variant="ghost"
          className={`flex-1 flex-col items-center justify-center py-3 px-2 text-center ${
            isActive("/downloads") ? "text-accent" : "text-gray-400"
          }`}
        >
          <Download className="h-5 w-5" />
          <span className="block text-xs mt-1">Downloads</span>
        </Button>
        
        <Button
          onClick={onUrlButtonClick}
          variant="ghost"
          className="flex-1 flex-col items-center justify-center py-3 px-2 text-center text-gray-400"
        >
          <Link className="h-5 w-5" />
          <span className="block text-xs mt-1">URL</span>
        </Button>
      </div>
    </nav>
  );
}
