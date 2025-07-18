import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { setupDirectDownloads } from "./direct-download";

// Lightweight solution focusing on reliable external APIs
export async function registerRoutes(app: Express): Promise<Server> {
  // Simple API to get video info
  app.get('/api/video-info/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      // Use external API for getting video info (more reliable than ytdl-core)
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Try to fetch video info from a reliable API
      try {
        // Using public API for info retrieval only
        const infoResponse = await axios.get(
          `https://api.giftedtech.web.id/api/youtube?url=${encodeURIComponent(videoUrl)}`, 
          { timeout: 10000 }
        );
        
        if (infoResponse.data && infoResponse.data.result) {
          const videoInfo = infoResponse.data.result;
          
          // Return standardized video info
          return res.json({
            id: videoId,
            title: videoInfo.title || 'Unknown title',
            author: videoInfo.channel || 'Unknown author',
            thumbnail: videoInfo.thumbnail || '',
            duration: videoInfo.duration || '0'
          });
        }
      } catch (infoError) {
        console.error('Error fetching video info from primary API:', infoError);
        // Will continue to fallback APIs
      }
      
      // Fallback API for video info
      try {
        const fallbackResponse = await axios.get(
          `https://api.hitomi.la/api/youtube/info?url=${encodeURIComponent(videoUrl)}`,
          { timeout: 10000 }
        );
        
        if (fallbackResponse.data) {
          const data = fallbackResponse.data;
          return res.json({
            id: videoId,
            title: data.title || 'Unknown title',
            author: data.author || 'Unknown author',
            thumbnail: data.thumbnail || '',
            duration: data.duration || '0'
          });
        }
      } catch (fallbackError) {
        console.error('Error fetching video info from fallback API:', fallbackError);
      }
      
      // If all APIs fail, return a minimal response
      return res.json({
        id: videoId,
        title: 'YouTube Video',
        author: 'Unknown',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: '0'
      });
      
    } catch (error: any) {
      console.error('Video info error:', error.message);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  });

  // Download API that relies on reliable public APIs
  app.post('/api/download', async (req, res) => {
    try {
      const { videoId, format, quality } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Use different APIs for audio vs video
      if (format === 'audio') {
        // Set headers for audio download
        res.setHeader('Content-Type', 'audio/mp3');
        res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
        
        // List of reliable audio download APIs (in order of preference)
        const audioApis = [
          // Y2Mate compatible API 
          `https://api.vevioz.com/api/button/mp3/${videoId}`,
          // Backup API
          `https://api.giftedtech.web.id/api/download/yta?apikey=gifted&url=${encodeURIComponent(videoUrl)}`,
          // Second backup
          `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`
        ];
        
        // Try each API until one works
        for (const apiUrl of audioApis) {
          try {
            console.log(`Trying audio API: ${apiUrl}`);
            const response = await axios.get(apiUrl, { 
              timeout: 15000,
              maxRedirects: 5
            });
            
            // Different APIs return different response structures
            let downloadUrl = null;
            
            // Check all possible response formats
            if (response.data) {
              downloadUrl = response.data.url || 
                          response.data.link ||
                          response.data.result?.url ||
                          response.data.result?.link ||
                          response.data.download_url ||
                          response.data.result?.download_url ||
                          response.data.dlink ||
                          null;
              
              // For APIs that return HTML with download links
              if (!downloadUrl && typeof response.data === 'string' && response.data.includes('href=')) {
                const matches = response.data.match(/href=["'](https:\/\/[^"']+\.mp3)["']/);
                if (matches && matches[1]) {
                  downloadUrl = matches[1];
                }
              }
            }
            
            if (downloadUrl) {
              console.log(`Found download URL: ${downloadUrl}`);
              
              // Stream the file directly to the client
              const fileResponse = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 30000,
                maxRedirects: 5,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              });
              
              // Pipe the data to the client
              fileResponse.data.pipe(res);
              return;
            }
          } catch (error) {
            console.error(`API error with ${apiUrl}:`, error.message);
            // Continue to next API
          }
        }
        
        // If all APIs failed
        return res.status(500).json({ message: 'Could not download audio from any source' });
      } 
      // Handle video downloads
      else if (format === 'video') {
        // Set headers for video download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp4"`);
        
        // Quality string for API URL
        const qualityParam = quality === '1080p' ? '1080' : quality === '720p' ? '720' : '480';
        
        // List of reliable video download APIs that work on mobile
        const videoApis = [
          // Primary API for mobile
          `https://api.giftedtech.web.id/api/download/ytv?apikey=gifted&url=${encodeURIComponent(videoUrl)}`,
          // Secondary API
          `https://api.giftedtech.web.id/api/download/ytmp4?apikey=gifted&url=${encodeURIComponent(videoUrl)}`,
          // Tertiary API
          `https://dl.y2mate.toolsxd.com/api/dl?url=${encodeURIComponent(videoUrl)}`,
          // Backup with different structure
          `https://loader.to/ajax/download.php?format=mp4&url=${encodeURIComponent(videoUrl)}`
        ];
        
        // Try each API until one works
        for (const apiUrl of videoApis) {
          try {
            console.log(`Trying video API: ${apiUrl}`);
            const response = await axios.get(apiUrl, { 
              timeout: 15000,
              maxRedirects: 5
            });
            
            // Different APIs return different response structures
            let downloadUrl = null;
            
            // Check all possible response formats
            if (response.data) {
              console.log("API response structure:", 
                Object.keys(response.data).length > 0 ? Object.keys(response.data) : 'Empty or string response');
              
              // For APIs that return nested data
              if (response.data.result && typeof response.data.result === 'object') {
                console.log("Found result object with keys:", Object.keys(response.data.result));
              }

              // Extract URL from various API response structures
              downloadUrl = response.data.url || 
                          response.data.link ||
                          response.data.result?.url ||
                          response.data.result?.link ||
                          response.data.download_url ||
                          response.data.result?.download_url ||
                          response.data.dlink ||
                          response.data.mp4 ||  // For some APIs
                          response.data.result?.mp4 ||
                          response.data.data?.url ||
                          response.data.result?.mp4?.url ||
                          null;
              
              // Handle special case for Giftedtech API (sometimes has odd structure)
              if (!downloadUrl && response.data.result && 
                  typeof response.data.result === 'object' && 
                  Object.keys(response.data.result).some(k => k.includes('mp4'))) {
                  
                const mp4Key = Object.keys(response.data.result).find(k => k.includes('mp4'));
                if (mp4Key && response.data.result[mp4Key]?.url) {
                  downloadUrl = response.data.result[mp4Key].url;
                }
              }
              
              // For APIs that return a direct download link in a string
              if (!downloadUrl && typeof response.data === 'string') {
                if (response.data.startsWith('http') && 
                    (response.data.includes('.mp4') || response.data.includes('/download/'))) {
                  downloadUrl = response.data.trim();
                }
                // For APIs that return HTML with download links
                else if (response.data.includes('href=')) {
                  const matches = response.data.match(/href=["'](https:\/\/[^"']+\.mp4)["']/);
                  if (matches && matches[1]) {
                    downloadUrl = matches[1];
                  }
                }
              }
            }
            
            if (downloadUrl) {
              console.log(`Found download URL: ${downloadUrl}`);
              
              // Stream the file directly to the client
              const fileResponse = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 30000,
                maxRedirects: 5,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              });
              
              // Pipe the data to the client
              fileResponse.data.pipe(res);
              return;
            }
          } catch (error) {
            console.error(`API error with ${apiUrl}:`, error.message);
            // Continue to next API
          }
        }
        
        // If all APIs failed
        return res.status(500).json({ message: 'Could not download video from any source' });
      }
      
      // If neither audio nor video was specified
      return res.status(400).json({ message: 'Invalid format specified' });
      
    } catch (error: any) {
      console.error('Download error:', error.message);
      
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Internal server error' });
      }
    }
  });

  // Setup direct downloads API (reliable Y2mate and yt5s based)
  setupDirectDownloads(app);
  
  // Error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}