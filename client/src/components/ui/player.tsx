import { useContext, useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { 
  X, Pause, Play, SkipBack, SkipForward, Maximize, 
  Minimize, Download, RotateCcw, Eye, EyeOff,
  Volume2, VolumeX, Volume1, Volume, Settings, Rewind, FastForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaContext } from "@/lib/context";
import { formatDuration } from "@/lib/utils";
import screenfull from "screenfull";

export function Player() {
  const {
    currentMedia,
    showPlayerModal,
    setShowPlayerModal,
    setShowDownloadModal,
    mediaList,
    setCurrentMedia
  } = useContext(MediaContext);

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  
  const playerRef = useRef<ReactPlayer>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced Media Session with better action handlers
  const setupMediaSession = () => {
    if ('mediaSession' in navigator && currentMedia) {
      // Set metadata with multiple artwork sizes
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentMedia.title || 'Unknown Title',
        artist: currentMedia.author || currentMedia.uploader || 'BMW XMD Go',
        album: 'BMW XMD Go Player',
        artwork: [
          { src: currentMedia.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentMedia.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
          { src: currentMedia.thumbnail || '', sizes: '192x192', type: 'image/jpeg' },
          { src: currentMedia.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
          { src: currentMedia.thumbnail || '', sizes: '384x384', type: 'image/jpeg' },
          { src: currentMedia.thumbnail || '', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      // Set action handlers for notification controls
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Media Session: Play');
        setPlaying(true);
        if (playerRef.current) {
          // Force ReactPlayer to play
          const internalPlayer = (playerRef.current as any).getInternalPlayer();
          if (internalPlayer && internalPlayer.playVideo) {
            internalPlayer.playVideo();
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Media Session: Pause');
        setPlaying(false);
        if (playerRef.current) {
          // Force ReactPlayer to pause
          const internalPlayer = (playerRef.current as any).getInternalPlayer();
          if (internalPlayer && internalPlayer.pauseVideo) {
            internalPlayer.pauseVideo();
          }
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        console.log('Media Session: Stop');
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (playerRef.current) {
          playerRef.current.seekTo(0);
        }
      });

      // FORCE next/previous handlers for notification buttons
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media Session: Next Track');
        handleNextTrack();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media Session: Previous Track');
        handlePreviousTrack();
      });

      // Additional seek handlers
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        console.log('Media Session: Seek Backward');
        const skipTime = details?.seekOffset || 10;
        if (playerRef.current) {
          const newTime = Math.max(0, currentTime - skipTime);
          playerRef.current.seekTo(newTime / duration);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        console.log('Media Session: Seek Forward');
        const skipTime = details?.seekOffset || 10;
        if (playerRef.current) {
          const newTime = Math.min(duration, currentTime + skipTime);
          playerRef.current.seekTo(newTime / duration);
        }
      });

      // Update position state
      if (duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: currentTime
          });
        } catch (e) {
          // Ignore position errors
        }
      }

      // Set playback state
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      
      console.log('Media Session setup complete');
    }
  };

  // Update Media Session when playing state changes
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }, [playing]);

  // Keep playback alive when page is hidden (for audio)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentMedia?.type === "audio" && playing) {
        console.log('Page hidden - maintaining audio playback');
        // Keep the ReactPlayer playing
        if (playerRef.current) {
          setTimeout(() => {
            const internalPlayer = (playerRef.current as any)?.getInternalPlayer();
            if (internalPlayer && internalPlayer.playVideo) {
              internalPlayer.playVideo();
            }
          }, 100);
        }
      } else if (!document.hidden) {
        console.log('Page visible - syncing state');
        setupMediaSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentMedia, playing]);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: landscape)").matches) {
        setIsLandscape(true);
        if (currentMedia?.type === "video" && playerContainerRef.current && screenfull.isEnabled) {
          screenfull.request(playerContainerRef.current);
          setIsFullscreen(true);
        }
      } else {
        setIsLandscape(false);
      }
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    handleOrientationChange();

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [currentMedia]);

  // Setup Media Session when media changes
  useEffect(() => {
    if (currentMedia) {
      setTimeout(() => {
        setupMediaSession();
      }, 1000); // Give ReactPlayer time to load
    }
  }, [currentMedia, duration]);

  // Update Media Session position regularly
  useEffect(() => {
    if ('mediaSession' in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: currentTime
        });
      } catch (e) {
        // Ignore position errors
      }
    }
  }, [currentTime, duration]);

  const handleClosePlayer = () => {
    if (currentMedia?.type === "audio") {
      setShowPlayerModal(false);
    } else {
      setShowPlayerModal(false);
      setPlaying(false);
      if (isFullscreen && screenfull.isEnabled) {
        screenfull.exit();
      }
    }
  };

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  const handlePlayPause = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = newPlaying ? 'playing' : 'paused';
    }
    
    resetControlsTimeout();
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played * 100);
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
    setIsLoading(false);
    setupMediaSession();
  };
  
  const handleReady = () => {
    setIsLoading(false);
    setupMediaSession();
  };
  
  const handleError = () => {
    setIsLoading(false);
    console.log('Media error, trying next track...');
    setTimeout(() => handleNextTrack(), 2000);
  };

  const handleEnded = () => {
    console.log('Media ended, playing next...');
    handleNextTrack();
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setProgress(percent * 100);
    
    if (playerRef.current) {
      playerRef.current.seekTo(percent);
    }
    
    resetControlsTimeout();
  };

  const handleNextTrack = () => {
    if (!mediaList || !currentMedia || mediaList.length <= 1) return;
    
    setProgress(0);
    setCurrentTime(0);
    setIsLoading(true);
    
    const currentIndex = mediaList.findIndex(item => item.id === currentMedia.id);
    if (currentIndex < mediaList.length - 1) {
      setCurrentMedia(mediaList[currentIndex + 1]);
    } else {
      setCurrentMedia(mediaList[0]);
    }
    
    setPlaying(true);
    resetControlsTimeout();
  };

  const handlePreviousTrack = () => {
    if (!mediaList || !currentMedia || mediaList.length <= 1) return;
    
    setProgress(0);
    setCurrentTime(0);
    setIsLoading(true);
    
    const currentIndex = mediaList.findIndex(item => item.id === currentMedia.id);
    if (currentIndex > 0) {
      setCurrentMedia(mediaList[currentIndex - 1]);
    } else {
      setCurrentMedia(mediaList[mediaList.length - 1]);
    }
    
    setPlaying(true);
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current || !screenfull.isEnabled) return;
    
    if (screenfull.isFullscreen) {
      screenfull.exit();
      setIsFullscreen(false);
    } else {
      screenfull.request(playerContainerRef.current);
      setIsFullscreen(true);
    }
    
    resetControlsTimeout();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  const resetControlsTimeout = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (currentMedia) {
      setPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setIsLoading(true);
      resetControlsTimeout();
    }
  }, [currentMedia]);

  useEffect(() => {
    if (!screenfull.isEnabled) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
      resetControlsTimeout();
    };

    screenfull.on('change', handleFullscreenChange);
    
    const handleMouseMove = () => {
      resetControlsTimeout();
    };
    
    if (playerContainerRef.current) {
      playerContainerRef.current.addEventListener('mousemove', handleMouseMove);
      playerContainerRef.current.addEventListener('touchstart', handleMouseMove);
    }
    
    return () => {
      screenfull.off('change', handleFullscreenChange);
      if (playerContainerRef.current) {
        playerContainerRef.current.removeEventListener('mousemove', handleMouseMove);
        playerContainerRef.current.removeEventListener('touchstart', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (!currentMedia || !showPlayerModal) return null;

  return (
    <div 
      ref={playerContainerRef}
      className={`player-container shadow-lg ${showPlayerModal ? "active" : ""} ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
    >
      {/* Toggle Controls Button - Always visible */}
      <div className="absolute top-2 right-2 z-50 flex space-x-3">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            toggleControls();
          }}
          variant="secondary"
          size="icon"
          className="bg-black/50 text-white rounded-full h-8 w-8 shadow-lg hover:bg-black/70 toggle-controls-btn mr-1"
          title="Toggle Controls"
        >
          {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleClosePlayer();
          }}
          variant="destructive"
          size="icon"
          className="bg-red-600/80 text-white rounded-full h-8 w-8 shadow-lg hover:bg-red-700 toggle-controls-btn ml-1"
          title="Close Player"
        >
          <X className="h-4 w-4 font-bold" />
        </Button>
      </div>

      {currentMedia.type === "video" ? (
        <div className={`relative ${isFullscreen ? "h-full" : ""}`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          )}
          
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${currentMedia.id}`}
            width="100%"
            height={isFullscreen ? "100vh" : "240px"}
            playing={playing}
            volume={isMuted ? 0 : volume / 100}
            playbackRate={playbackRate}
            controls={false}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onReady={handleReady}
            onError={handleError}
            onEnded={handleEnded}
            config={{
              youtube: {
                playerVars: { 
                  showinfo: 0, 
                  controls: 0, 
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                  fs: 1
                }
              }
            }}
            style={{ 
              backgroundColor: "black",
              objectFit: "cover",
              width: "100%",
              height: isFullscreen ? "100vh" : "240px"
            }}
          />

          {/* Keep all your existing video controls */}
          {showControls && (
            <>
              <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent z-20">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-white text-sm truncate pr-12 max-w-full">
                    {currentMedia.title}
                  </h3>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosePlayer();
                        window.location.href = '/';
                      }}
                      variant="destructive" 
                      size="icon"
                      className="text-white bg-red-600/80 hover:bg-red-700 rounded-full"
                    >
                      <X className="h-5 w-5 font-bold" />
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      variant="ghost" 
                      size="icon"
                      className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent z-20">
                <div 
                  className="w-full py-4 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                >
                  <div 
                    className="w-full h-1.5 bg-gray-700/50 rounded-full relative overflow-hidden" 
                    ref={progressRef}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-accent/30 rounded-full" 
                      style={{ width: `${Math.min(100, progress + 15)}%` }}
                    />
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full" 
                      style={{ 
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #7c3aed, #8b5cf6, #9333ea)'
                      }}
                    />
                  </div>
                </div>
                
                <div 
                  className="flex justify-between -mt-1 text-xs text-gray-300 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                >
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)} <small>({Math.round(progress)}%)</small></span>
                </div>
                
                <div className="flex justify-center items-center mt-1">
                  <div className="flex space-x-8">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviousTrack();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white bg-transparent"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white bg-transparent"
                    >
                      {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextTrack();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white bg-transparent"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Keep all your existing volume controls and other features */}
                <div className="absolute bottom-12 left-4 z-30">
                  {showVolumeSlider && (
                    <div 
                      className="bg-black/70 p-2 mb-2 rounded-lg" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="h-24 w-1.5 bg-gray-700 rounded-full relative">
                        <div 
                          className="absolute bottom-0 w-full bg-accent rounded-full"
                          style={{ height: `${volume}%` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value))}
                          className="absolute h-24 w-5 opacity-0 cursor-pointer"
                          style={{ transform: "rotate(180deg)", transformOrigin: "center" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-12 right-4 z-30">
                  {showPlaybackOptions && (
                    <div 
                      className="bg-black/70 p-2 rounded-lg flex flex-col space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[0.5, 1, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setPlaybackRate(rate);
                            setShowPlaybackOptions(false);
                            resetControlsTimeout();
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            playbackRate === rate ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 flex space-x-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMuted) {
                        setIsMuted(false);
                      } else if (volume === 0) {
                        setVolume(100);
                      } else {
                        setIsMuted(!isMuted);
                      }
                      resetControlsTimeout();
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVolumeSlider(!showVolumeSlider);
                      if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
                      if (!showVolumeSlider) {
                        sliderTimeoutRef.current = setTimeout(() => {
                          setShowVolumeSlider(false);
                        }, 5000);
                      }
                      resetControlsTimeout();
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/30 rounded-full h-8 w-8"
                    title="Volume"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 30 ? (
                      <Volume className="h-4 w-4" />
                    ) : volume < 70 ? (
                      <Volume1 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlaybackOptions(!showPlaybackOptions);
                      if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
                      if (!showPlaybackOptions) {
                        sliderTimeoutRef.current = setTimeout(() => {
                          setShowPlaybackOptions(false);
                        }, 5000);
                      }
                      resetControlsTimeout();
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/30 rounded-full h-8 w-8"
                    title="Playback Speed"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>         
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playerRef.current) {
                        const newTime = Math.max(0, currentTime - 10);
                        playerRef.current.seekTo(newTime / duration);
                      }
                      resetControlsTimeout();
                    }}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 text-white bg-transparent rounded-full"
                    title="Skip Back 10s"
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playerRef.current) {
                        const newTime = Math.min(duration, currentTime + 10);
                        playerRef.current.seekTo(newTime / duration);
                      }
                      resetControlsTimeout();
                    }}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 text-white bg-transparent rounded-full"
                    title="Skip Forward 10s"
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleControls();
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/30 rounded-full h-8 w-8 toggle-controls-btn"
                    title="Toggle Controls"
                  >
                    {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.screen && window.screen.orientation) {
                        try {
                          const screenOrientation = window.screen.orientation as any;
                          if (screenOrientation.type && screenOrientation.type.includes('portrait')) {
                            if (screenOrientation.lock) {
                              screenOrientation.lock('landscape').catch(() => {
                                toggleFullscreen();
                              });
                            } else {
                              toggleFullscreen();
                            }
                          } else {
                            if (screenOrientation.lock) {
                              screenOrientation.lock('portrait').catch(() => {
                                toggleFullscreen();
                              });
                            } else {
                              toggleFullscreen();
                            }
                          }
                        } catch (err) {
                          toggleFullscreen();
                        }
                      } else {
                        toggleFullscreen();
                      }
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/30 rounded-full h-8 w-8"
                    title="Rotate Screen"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Audio Player - using ReactPlayer for both audio and video */
        <div className="p-3 bg-[#111111]">
          {/* Hidden ReactPlayer for audio */}
          <div style={{ display: 'none' }}>
            <ReactPlayer
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${currentMedia.id}`}
              width="0"
              height="0"
              playing={playing}
              volume={isMuted ? 0 : volume / 100}
              playbackRate={playbackRate}
              controls={false}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onReady={handleReady}
              onError={handleError}
              onEnded={handleEnded}
              config={{
                youtube: {
                  playerVars: { 
                    showinfo: 0, 
                    controls: 0, 
                    modestbranding: 1,
                    rel: 0
                  }
                }
              }}
            />
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={currentMedia.thumbnail} 
                alt="Audio thumbnail" 
                className="w-14 h-14 rounded-md object-cover" 
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-medium text-white text-sm">{currentMedia.title}</h3>
              <div className="flex items-center mt-2">
                <Button
                  onClick={handlePreviousTrack}
                  variant="ghost"
                  size="icon"
                  className="p-0 h-auto text-white mr-1"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size="icon"
                  className="p-0 h-auto text-white mr-1"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={handleNextTrack}
                  variant="ghost"
                  size="icon"
                  className="p-0 h-auto text-white mr-1"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <div className="w-full py-2 cursor-pointer" 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleProgressBarClick(e);
                       }}>
                    <div className="w-full h-1 bg-gray-700 rounded-full relative overflow-hidden" 
                         ref={progressRef}>
                      <div 
                        className="absolute top-0 left-0 h-full bg-accent/30 rounded-full" 
                        style={{ width: `${Math.min(100, progress + 15)}%` }}
                      />
                      <div 
                        className="absolute top-0 left-0 h-full rounded-full" 
                        style={{ 
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #8b5cf6, #9333ea)'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <span className="text-xs text-gray-400 ml-2">
                  {formatDuration(currentTime)}/{formatDuration(duration)} 
                  <small className="ml-1">({Math.round(progress)}%)</small>
                </span>
              </div>
            </div>
            <div className="flex space-x-3 ml-2">
              <Button
                onClick={handleDownloadClick}
                variant="ghost"
                size="icon"
                className="text-white bg-transparent"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
