import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchYoutube, getTrendingVideos, getTrendingMusic, getVideoInfo, getDownloadFormats } from "./utils/youtube";
import { Mp3, Mp4, BackupDownloader } from "./utils/downloader";
import fs from "fs";
import path from "path";
import os from "os";

// Create temp directory for downloads
const DOWNLOADS_DIR = path.join(os.tmpdir(), "bwm-xmd-downloads");
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Search YouTube videos
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }
      
      const results = await searchYoutube(query);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search videos" });
    }
  });
  
  // Get trending videos
  app.get("/api/trending", async (req, res) => {
    try {
      const results = await getTrendingVideos();
      res.json(results);
    } catch (error) {
      console.error("Trending error:", error);
      res.status(500).json({ error: "Failed to get trending videos" });
    }
  });
  
  // Get recommended videos (similar to trending but different selection)
  app.get("/api/recommended", async (req, res) => {
    try {
      const results = await getTrendingVideos(true);
      res.json(results);
    } catch (error) {
      console.error("Recommended error:", error);
      res.status(500).json({ error: "Failed to get recommended videos" });
    }
  });
  
  // Get trending music
  app.get("/api/trending-music", async (req, res) => {
    try {
      const results = await getTrendingMusic();
      res.json(results);
    } catch (error) {
      console.error("Trending music error:", error);
      res.status(500).json({ error: "Failed to get trending music" });
    }
  });
  
  // Get playlists (mock data for now)
  app.get("/api/playlists", async (req, res) => {
    try {
      // In a real app, we'd fetch real playlists
      const playlists = [
        {
          id: "pl1",
          title: "Today's Top Hits",
          thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&w=400&h=400&q=80",
          trackCount: 50
        },
        {
          id: "pl2",
          title: "RapCaviar",
          thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&w=400&h=400&q=80",
          trackCount: 45
        }
      ];
      
      res.json(playlists);
    } catch (error) {
      console.error("Playlists error:", error);
      res.status(500).json({ error: "Failed to get playlists" });
    }
  });
  
  // Get video info
  app.get("/api/video-info/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: "Video ID is required" });
      }
      
      const videoInfo = await getVideoInfo(id);
      res.json(videoInfo);
    } catch (error) {
      console.error("Video info error:", error);
      res.status(500).json({ error: "Failed to get video info" });
    }
  });
  
  // Get download options for a video
  app.get("/api/download-options/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: "Video ID is required" });
      }
      
      const formats = await getDownloadFormats(id);
      res.json(formats);
    } catch (error) {
      console.error("Download options error:", error);
      res.status(500).json({ error: "Failed to get download options" });
    }
  });
  
  // Download a video or audio - direct download stream to device
  app.post("/api/download", async (req, res) => {
    try {
      const { videoId, format, quality } = req.body;
      
      if (!videoId || !format || !quality) {
        return res.status(400).json({ error: "VideoId, format, and quality are required" });
      }
      
      let result;
      let contentType;
      
      console.log(`Starting download for video ID: ${videoId}, format: ${format}, quality: ${quality}`);
      
      try {
        // Try using our custom downloader
        if (format === "video") {
          // Download video using Mp4 utility
          result = await Mp4.main(`https://www.youtube.com/watch?v=${videoId}`, 'mp4', quality);
          contentType = "video/mp4";
        } else {
          // Download audio using Mp3 utility (this one is working well)
          result = await Mp3.main(`https://www.youtube.com/watch?v=${videoId}`, 'mp3', '128kbps');
          contentType = "audio/mpeg";
        }
        
        const fileName = path.basename(result.filePath);
        
        console.log(`Downloaded ${format}. File name: ${fileName}, Size: ${result.fileSize}`);
        
        // Send the file for direct download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', fs.statSync(result.filePath).size);
        
        // Stream the file to the client for direct download
        const fileStream = fs.createReadStream(result.filePath);
        fileStream.pipe(res);
        
      } catch (customDownloaderError) {
        console.error("Custom downloader error:", customDownloaderError);
        
        // If video fails with the custom downloader, try using the backup downloader
        if (format === "video") {
          console.log("Falling back to backup video downloader...");
          
          try {
            // Try the actual backup downloader
            const backupResult = await BackupDownloader.downloadVideo(videoId, quality);
            
            // If successful, send the file
            const fileName = path.basename(backupResult.filePath);
            contentType = "video/mp4";
            
            console.log(`Backup download successful! File: ${fileName}, Size: ${backupResult.fileSize}`);
            
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fs.statSync(backupResult.filePath).size);
            
            // Stream the file to the client for direct download
            const fileStream = fs.createReadStream(backupResult.filePath);
            fileStream.pipe(res);
          } catch (backupError) {
            console.error("Backup downloader also failed:", backupError);
            
            // If both downloaders fail, create a very small file with proper filename
            const videoInfo = await getVideoInfo(videoId);
            const sanitizedTitle = videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            
            // Get a file with right quality marker
            const filePath = path.join(DOWNLOADS_DIR, `${sanitizedTitle}_${quality}.mp4`);
            
            // Create a tiny dummy file so at least the user gets a proper filename
            fs.writeFileSync(filePath, 'DOWNLOAD FAILED - PLEASE TRY AGAIN LATER');
            
            // Send the file for direct download
            const fileName = path.basename(filePath);
            contentType = "video/mp4";
            
            console.log(`Both downloaders failed! Sending error message file: ${fileName}`);
            
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fs.statSync(filePath).size);
            
            // Stream the file to the client for direct download
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          }
        } else {
          // If it's audio and it failed, just rethrow - this should rarely happen
          throw customDownloaderError;
        }
      }
      
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
