import { useEffect, useRef, useState } from "react";
import { Search, X, Menu, Download, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
}

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  isSearchActive,
  setIsSearchActive 
}: NavbarProps) {
  const [, setLocation] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  const handleToggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    setShowHistory(false);
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setShowHistory(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Add to search history if not already present
      if (!searchHistory.includes(query)) {
        const newHistory = [query, ...searchHistory].slice(0, 10); // Keep last 10 searches
        setSearchHistory(newHistory);
      }
      setLocation(`/search?q=${encodeURIComponent(query)}`);
      setShowHistory(false);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    setShowHistory(false);
    setIsSearchActive(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleInstallClick = () => {
    window.open("https://bwm-xmd-go.vercel.app", "_blank");
  };

  // Focus input when search is activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const links = [
    { name: "Ultraxas Homepage", url: "https://www.ultraxas.com/" },
    { name: "Ultraxas Chatbot", url: "https://t.me/UltraXas_Chatbot" },
    { name: "Ultraxas Music Bot", url: "https://t.me/Ultraxas_Musicbot" },
    { name: "Ultraxas Downloader Bot", url: "https://t.me/Ultraxas_DownloaderBot" },
    { name: "Ultraxas Shortener", url: "https://t.me/Uxurl_Bot" },
    { name: "GitHub Account", url: "https://github.com/xason0" },
    { name: "Facebook", url: "https://www.facebook.com/share/15qsuhGdfM/?mibextid=wwXIfr" },
    { name: "Telegram", url: "https://t.me/ultraxasdev" },
    { name: "TikTok Account", url: "https://tiktok.com/@ultraxas" },
    { name: "Snapchat", url: "https://t.snapchat.com/qVtFVvSf" },
    { name: "Whatsapp", url: "https://wa.me/447405817307?" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-secondary z-30 border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-white whitespace-nowrap">
          ULTRAXAS GO <span className="text-primary">PRO</span>
        </h1>
        
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Search Button - shown only when search is inactive */}
          {!isSearchActive && (
            <Button 
              onClick={handleToggleSearch}
              variant="outline" 
              size="sm"
              className="text-white bg-accent hover:bg-accent/80 border-0 flex gap-1 items-center px-2 md:px-3"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs md:text-sm hidden sm:inline">Search</span>
              <kbd className="hidden md:inline ml-1 text-xs bg-black/30 px-1.5 py-0.5 rounded">⌘K</kbd>
            </Button>
          )}
          
          {/* Install Button */}
          <Button 
            onClick={handleInstallClick}
            variant="outline" 
            size="sm"
            className="text-white bg-accent hover:bg-accent/80 border-0 flex gap-1 items-center px-2 md:px-3"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs md:text-sm hidden sm:inline">Install</span>
          </Button>
          
          {/* Menu Button */}
          <Button 
            onClick={toggleMenu}
            variant="outline" 
            size="sm"
            className="text-white bg-accent hover:bg-accent/80 border-0 p-2"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-black/90 z-50 transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="relative h-full w-full p-6 overflow-y-auto">
          <Button 
            onClick={toggleMenu}
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 text-white"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">BWM XMD LINKS</h2>
            <div className="grid grid-cols-1 gap-3">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-800/50 hover:bg-gray-700/70 rounded-lg text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab indicator - will be controlled by bottom nav */}
      <div className="fixed top-[59px] left-0 right-0 h-1 z-30">
        <div 
          className="tab-indicator bg-primary h-full w-1/4" 
          id="tab-indicator"
        ></div>
      </div>
      
      {/* Search Bar */}
      <div className={`px-4 py-2 pb-3 ${isSearchActive ? 'block' : 'hidden'}`}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search videos or music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(true)}
              className="w-full bg-[#272727] text-white placeholder-gray-400 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            {searchQuery && (
              <Button
                type="button"
                onClick={handleClearSearch}
                variant="ghost"
                size="icon"
                className="absolute right-10 top-2 text-gray-400 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            type="button"
            onClick={handleCloseSearch}
            variant="ghost"
            size="icon"
            className="text-gray-400 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-2"
          >
            Search
          </Button>
        </form>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-[#272727] rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center p-2 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Recent Searches
              </h3>
              <button 
                onClick={clearSearchHistory}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
            <ul>
              {searchHistory.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleHistoryItemClick(item)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600/50 flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
