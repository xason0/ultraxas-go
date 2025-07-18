import type { Express } from "express";
import axios from "axios";

// Direct download implementation that works reliably for videos
export function setupDirectDownloads(app: Express): void {
  // Direct video download endpoint
  app.post('/api/direct-video', async (req, res) => {
    try {
      const { videoId, quality } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      // Different quality options
      const qualityParam = quality === '1080p' ? '1080' : quality === '720p' ? '720' : '480';
      
      // Basic video details
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const videoTitle = videoId; // Simple fallback
      
      // Set headers for direct streaming response
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      
      // For mobile compatibility, use a direct download link approach
      // This is more reliable than streaming for mobile devices
      try {
        // Y2Mate direct API (reliable for videos)
        const infoResponse = await axios.post('https://mate-api.y2mate.com/api/json/convert', {
          url: videoUrl,
          mp3: false, // We want mp4/video
          mp4: true,
          quality: qualityParam, // quality
          server: "en68" // Use a reliable server
        });
        
        if (infoResponse.data && infoResponse.data.result && infoResponse.data.result.download) {
          // Redirect to the direct download URL (works better on mobile)
          return res.redirect(infoResponse.data.result.download);
        }
      } catch (y2mateError) {
        console.error("Y2Mate API failed:", y2mateError);
      }
      
      // If direct download fails, try another trusted API
      try {
        // Reliable alternative API
        const response = await axios.get(
          `https://api.giftedtech.web.id/api/download/ytv?apikey=gifted&url=${encodeURIComponent(videoUrl)}`
        );
        
        if (response.data && response.data.result && response.data.result.url) {
          // Stream directly to client
          const videoStream = await axios({
            url: response.data.result.url,
            method: 'GET',
            responseType: 'stream'
          });
          
          videoStream.data.pipe(res);
          return;
        }
      } catch (giftedError) {
        console.error("Gifted API failed:", giftedError);
      }
      
      // If all attempts fail, return error
      return res.status(500).json({ 
        message: 'Could not download video from any source',
        success: false
      });
      
    } catch (error: any) {
      console.error("Video download error:", error.message);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: error.message || 'Internal server error',
          success: false
        });
      }
    }
  });
  
  // Endpoint to get direct download URL without streaming
  app.post('/api/video-link', async (req, res) => {
    try {
      const { videoId, quality } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      // Video details
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Try multiple APIs to find a reliable direct download link
      try {
        // Try yt5s API (reliable for direct links)
        const yt5sResponse = await axios.post('https://yt5s.com/api/ajaxSearch', 
          new URLSearchParams({
            q: videoUrl,
            vt: 'mp4'
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15'
            }
          }
        );
        
        if (yt5sResponse.data && yt5sResponse.data.links) {
          const links = yt5sResponse.data.links;
          const formats = Object.keys(links);
          
          // Find the requested quality or closest available
          let selectedFormat = '';
          if (quality === '1080p' && formats.includes('mp4a1080')) {
            selectedFormat = 'mp4a1080';
          } else if (quality === '720p' && formats.includes('mp4a720')) {
            selectedFormat = 'mp4a720';
          } else if (formats.includes('mp4a480')) {
            selectedFormat = 'mp4a480';
          } else if (formats.length > 0) {
            // Just get first available quality
            selectedFormat = formats[0];
          }
          
          if (selectedFormat && links[selectedFormat]) {
            const linkData = links[selectedFormat];
            
            // Get the actual download link
            const convertResponse = await axios.post('https://yt5s.com/api/ajaxConvert', 
              new URLSearchParams({
                vid: yt5sResponse.data.vid,
                k: linkData.k
              }),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15'
                }
              }
            );
            
            if (convertResponse.data && convertResponse.data.dlink) {
              return res.json({
                success: true,
                downloadUrl: convertResponse.data.dlink,
                title: yt5sResponse.data.title || videoId,
                quality: selectedFormat
              });
            }
          }
        }
      } catch (yt5sError) {
        console.error("YT5S API failed:", yt5sError);
      }
      
      // Fallback to giftedtech API
      try {
        const giftedResponse = await axios.get(
          `https://api.giftedtech.web.id/api/download/ytv?apikey=gifted&url=${encodeURIComponent(videoUrl)}`
        );
        
        if (giftedResponse.data && giftedResponse.data.result && giftedResponse.data.result.url) {
          return res.json({
            success: true,
            downloadUrl: giftedResponse.data.result.url,
            title: giftedResponse.data.result.title || videoId,
            quality: quality
          });
        }
      } catch (giftedError) {
        console.error("Gifted API failed:", giftedError);
      }
      
      // If all attempts fail
      return res.status(500).json({ 
        message: 'Could not find a reliable download link',
        success: false
      });
      
    } catch (error: any) {
      console.error("Video link error:", error.message);
      res.status(500).json({ 
        message: error.message || 'Internal server error',
        success: false
      });
    }
  });
}