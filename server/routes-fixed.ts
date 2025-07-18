import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import ytdl from 'ytdl-core';

// Lightweight solution for downloading without storing files
export async function registerRoutes(app: Express): Promise<Server> {
  // API route for downloads
  app.post('/api/download', async (req, res) => {
    try {
      const { videoId, format, quality } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Direct ytdl streaming - most memory efficient
      try {
        console.log(`Starting direct download for ${videoId}, format: ${format}, quality: ${quality}`);
        
        // Get info to set proper filename
        const info = await ytdl.getBasicInfo(videoUrl);
        const fileName = `${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Set up ytdl options depending on format and quality
        let ytdlOptions: any = {};
        
        if (format === 'audio') {
          ytdlOptions = {
            quality: 'highestaudio',
            filter: 'audioonly',
          };
          
          // Set appropriate headers for audio
          res.setHeader('Content-Type', 'audio/mp3');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}.mp3"`);
        } else {
          // Map quality to appropriate filter
          switch (quality) {
            case '1080p': 
              ytdlOptions = { quality: 'highest' };
              break;
            case '720p':
              ytdlOptions = { 
                quality: 'highestvideo', 
                filter: (fmt: any) => fmt.qualityLabel === '720p' 
              };
              break;
            case '480p':
              ytdlOptions = { 
                quality: 'highestvideo', 
                filter: (fmt: any) => fmt.qualityLabel === '480p' 
              };
              break;
            default:
              ytdlOptions = { quality: 'highestvideo' };
          }
          
          // Set appropriate headers for video
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}.mp4"`);
        }
        
        // Stream directly to response - most efficient approach
        const stream = ytdl(videoUrl, ytdlOptions);
        
        // Handle errors
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Stream error occurred' });
          }
        });
        
        // Pipe directly to response (memory efficient)
        stream.pipe(res);
        
        return;
      } catch (ytdlError) {
        console.error('ytdl direct streaming failed:', ytdlError);
        
        // If direct streaming fails, try fallback method with specific formats
        try {
          console.log('Trying fallback with specific format download');
          const info = await ytdl.getInfo(videoUrl);
          
          let formatObj;
          
          if (format === 'audio') {
            // Get highest audio quality format
            formatObj = ytdl.chooseFormat(info.formats, { 
              quality: 'highestaudio',
              filter: 'audioonly'
            });
          } else {
            // For video, choose based on quality
            let height = 720; // Default to 720p
            
            switch (quality) {
              case '1080p': height = 1080; break;
              case '720p': height = 720; break;
              case '480p': height = 480; break;
            }
            
            // Get the best format close to requested height
            formatObj = info.formats
              .filter(format => format.hasVideo && typeof format.height === 'number')
              .sort((a, b) => {
                const aHeight = a.height || 0;
                const bHeight = b.height || 0;
                const aDiff = Math.abs(aHeight - height);
                const bDiff = Math.abs(bHeight - height);
                return aDiff - bDiff;
              })[0];
          }
          
          if (!formatObj) {
            throw new Error('No suitable format found');
          }
          
          // Set content type based on format
          const contentType = format === 'audio' ? 'audio/mp3' : 'video/mp4';
          const ext = format === 'audio' ? 'mp3' : 'mp4';
          
          // Set headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', 
            `attachment; filename="${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}"`);
            
          // Stream the specific format
          ytdl(videoUrl, { format: formatObj })
            .pipe(res);
            
          return;
        } catch (fallbackError) {
          console.error('Fallback download failed:', fallbackError);
          // Try one more approach - direct server download for fallback
          try {
            // Only do this if fallback is necessary
            console.log("Trying final direct server download");
            
            // Set appropriate headers based on format
            const contentType = format === 'audio' ? 'audio/mp3' : 'video/mp4';
            const ext = format === 'audio' ? 'mp3' : 'mp4';
            const title = videoId;
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${title}.${ext}"`);
            
            // Basic ytdl options
            const ytdlOpts = format === 'audio' 
              ? { quality: 'highestaudio', filter: 'audioonly' }
              : { quality: 'highestvideo' };
              
            // Stream directly to client
            ytdl(videoUrl, ytdlOpts).pipe(res);
            return;
          } catch (finalError) {
            console.error("Final direct download failed:", finalError);
            res.status(500).json({ message: 'All download methods failed' });
            return;
          }
        }
      }
    } catch (error: any) {
      console.error('Download error:', error.message);
      
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Internal server error' });
      }
    }
  });

  // Simple API to get video info (lightweight)
  app.get('/api/video-info/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Get basic info (uses less memory than full info)
      const info = await ytdl.getBasicInfo(videoUrl);
      
      // Return minimal info
      res.json({
        id: videoId,
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        thumbnail: info.videoDetails.thumbnails[0]?.url || '',
        duration: info.videoDetails.lengthSeconds
      });
      
    } catch (error: any) {
      console.error('Video info error:', error.message);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}