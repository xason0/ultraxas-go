import yts from 'yt-search';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Create temp directory for downloads
const DOWNLOADS_DIR = path.join(os.tmpdir(), 'bwm-xmd-downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Setup axios with cookie jar
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

// Helper function to extract video ID from a YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// yt-search function to search for videos or handle YouTube URLs
async function ytsearch(query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      let searchQuery = query;
      if (query.startsWith('http://') || query.startsWith('https://')) {
        const videoId = extractVideoId(query);
        if (videoId) {
          searchQuery = videoId;
        } else {
          reject(new Error('Invalid YouTube URL'));
          return;
        }
      }

      yts(searchQuery)
        .then((data) => {
          resolve(data.all);
        })
        .catch((error) => {
          reject(error);
          console.error(error);
        });
    } catch (error) {
      reject(error);
      console.error(error);
    }
  });
}

const BackupDownloader = {
  async getVideoInfo(query: string): Promise<{ title: string; thumbnail: string }> {
    const videoSearchResults = await ytsearch(query);
    const video = videoSearchResults[0];
    return {
      title: video?.title || 'unknown',
      thumbnail: video?.thumbnail || ''
    };
  },

  // MP3 Fallback APIs
  async downloadMP3Fallback(query: string): Promise<{ downloadUrl: string }> {
    try {
      // Try first fallback API
      const url1 = `https://apis.davidcyriltech.my.id/song?query=${encodeURIComponent(query)}`;
      const response1 = await axios.get(url1);
      if (response1.data?.url) {
        return { downloadUrl: response1.data.url };
      }

      // Try second fallback API
      const videoId = extractVideoId(query) || query;
      const url2 = `https://apis.davidcyriltech.my.id/youtube/mp3?url=https://youtube.com/watch?v=${videoId}`;
      const response2 = await axios.get(url2);
      if (response2.data?.url) {
        return { downloadUrl: response2.data.url };
      }

      throw new Error('All MP3 fallback APIs failed');
    } catch (error) {
      console.error('MP3 Fallback Error:', error);
      throw error;
    }
  },

  // MP4 Fallback APIs
  async downloadMP4Fallback(query: string, quality: string): Promise<{ downloadUrl: string }> {
    try {
      // Try first fallback API
      const url1 = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(query)}`;
      const response1 = await axios.get(url1);
      if (response1.data?.url) {
        return { downloadUrl: response1.data.url };
      }

      // Try second fallback API
      const videoId = extractVideoId(query) || query;
      const url2 = `https://apis.davidcyriltech.my.id/download/ytmp4?url=https://youtube.com/watch?v=${videoId}`;
      const response2 = await axios.get(url2);
      if (response2.data?.url) {
        return { downloadUrl: response2.data.url };
      }

      throw new Error('All MP4 fallback APIs failed');
    } catch (error) {
      console.error('MP4 Fallback Error:', error);
      throw error;
    }
  },

  // Friend's MP3 downloader implementation
  async friendMP3Downloader(query: string): Promise<{ downloadUrl: string }> {
    try {
      const key = await this.scrapeData(query);
      if (!key) throw new Error('Failed to get key');

      const downloadUrl = await this.scrapeSite(key, "audio", "128");
      if (!downloadUrl) throw new Error('Failed to get download URL');

      return { downloadUrl };
    } catch (error) {
      console.error("Friend's MP3 Downloader Error:", error);
      throw error;
    }
  },

  // Friend's MP4 downloader implementation
  async friendMP4Downloader(query: string, quality: string): Promise<{ downloadUrl: string }> {
    try {
      const key = await this.scrapeData(query);
      if (!key) throw new Error('Failed to get key');

      const qualityMap: Record<string, string> = {
        '240p': '240',
        '360p': '360',
        '480p': '480',
        '720p': '720',
        '1080p': '1080'
      };
      const mappedQuality = qualityMap[quality] || '720';

      const downloadUrl = await this.scrapeSite(key, "video", mappedQuality);
      if (!downloadUrl) throw new Error('Failed to get download URL');

      return { downloadUrl };
    } catch (error) {
      console.error("Friend's MP4 Downloader Error:", error);
      throw error;
    }
  },

  // Helper functions for friend's downloader
  async scrapeData(q: string): Promise<string | null> {
    const url = 'https://cdn59.savetube.su/info';
    const headers = {
      'authority': 'cdn59.savetube.su',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Content-Type': 'application/json',
      'Origin': 'https://yt.savetube.me',
      'Referer': 'https://yt.savetube.me/',
      'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    };

    const data = { url: q };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data?.data?.key;
    } catch (error) {
      console.log('Error fetching data:', error.message);
      return null;
    }
  },

  async scrapeSite(key: string, type: string, quality: string): Promise<string | null> {
    const url = 'https://cdn61.savetube.su/download';
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Content-Type': 'application/json',
      'Origin': 'https://yt.savetube.me',
      'Referer': 'https://yt.savetube.me/',
      'Sec-Ch-Ua': '"Not.A.Brand";v="99", "Chromium";v="124"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    };

    const data = {
      downloadType: type,
      quality: quality,
      key: key,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data?.data?.downloadUrl;
    } catch (error) {
      console.log('Error fetching data:', error.message);
      throw error;
    }
  }
};

const Mp3 = {
  baseURL: 'https://y2save.com',
  headers: {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'origin': 'https://y2save.com',
    'referer': 'https://y2save.com/id',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest'
  },
  fmt: ['mp4', 'mp3'],
  qualities: {
    mp4: ['360P', '480P', '720p', '1080P'],
    mp3: ['128kbps']
  },

  geToken: async function (): Promise<string> {
    try {
      const response = await client.get(`${this.baseURL}/id`, { headers: this.headers });
      const $ = cheerio.load(response.data);
      return $('meta[name="csrf-token"]').attr('content') || '';
    } catch (error) {
      console.error('CSRF Token not found!');
      throw error;
    }
  },

  search: async function (link: string): Promise<any> {
    try {
      const token = await this.geToken();
      const response = await client.post(
        `${this.baseURL}/search`,
        `_token=${token}&query=${encodeURIComponent(link)}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('No response from search!');
      throw error;
    }
  },

  convert: async function (vid: string, key: string): Promise<any> {
    try {
      const token = await this.geToken();
      const response = await client.post(
        `${this.baseURL}/searchConvert`,
        `_token=${token}&vid=${vid}&key=${encodeURIComponent(key)}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('No response from convert!');
      throw error;
    }
  },

  getfmt: function (resultx: any): any {
    const formats = {
      mp4: resultx.data.convert_links.video.map((v: any) => v.quality),
      mp3: resultx.data.convert_links.audio.map((a: any) => a.quality)
    };
    return formats;
  },

  saveToTemp: async function (buffer: Buffer, title: string): Promise<string> {
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const fileTypee = await fileTypeFromBuffer(buffer);
      const extension = fileTypee?.ext || 'mp3';

      const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `${sanitizedTitle}.${extension}`;
      const filePath = path.join(DOWNLOADS_DIR, fileName);
      
      fs.writeFileSync(filePath, buffer);
      
      // Set up auto-cleanup after 10 minutes
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      }, 600000); // 10 minutes
      
      return filePath;
    } catch (error: any) {
      console.error('Failed to save to temp:', error.message);
      throw error;
    }
  },

  main: async function (link: string, format = 'mp3', quality = '128kbps'): Promise<{
    type: string;
    quality: string;
    title: string;
    thumbnail: string;
    filePath: string;
    fileSize: string;
  }> {
    try {
      console.log(`MP3 Downloader - Started with link: ${link}, format: ${format}, quality: ${quality}`);
      
      if (!this.fmt.includes(format)) {
        throw new Error(`Invalid format! Choose one of: ${this.fmt.join(', ')}`);
      }

      console.log('MP3 Downloader - Searching for video...');
      const videoSearchResults = await ytsearch(link);
      const video = videoSearchResults[0];
      const title = video?.title || 'unknown';
      const thumbnail = video?.thumbnail || '';
      
      console.log(`MP3 Downloader - Found video: ${title}`);
      
      if (!video) {
        throw new Error('No video found for the provided ID!');
      }
      
      console.log('MP3 Downloader - Getting download options...');
      const resultx = await this.search(link);
      if (resultx.status !== 'ok') {
        throw new Error('No results!');
      }
      
      const fmt = this.getfmt(resultx);
      console.log(`MP3 Downloader - Available formats: `, fmt);
      
      let converts = format === 'mp4' ? resultx.data.convert_links.video : resultx.data.convert_links.audio;
      console.log(`MP3 Downloader - Looking for quality: ${quality} in available options`);
      
      // Find the audio format (usually 128kbps)
      const vo = converts.find((v: any) => v.quality === quality);
      
      if (!vo) {
        // If exact match not found, use the first available audio format
        console.log(`MP3 Downloader - Quality ${quality} not found, using default quality`);
        if (converts.length > 0) {
          quality = converts[0].quality;
          const vo = converts[0];
          console.log(`MP3 Downloader - Using quality: ${quality}`);
          
          console.log('MP3 Downloader - Converting audio...');
          const vr = await this.convert(resultx.data.vid, vo.key);
          console.log('MP3 Downloader - Conversion response:', vr);
          
          if (vr.status !== 'ok' || !vr.dlink) {
            throw new Error('Conversion failed or download link not available');
          }
          
          console.log(`MP3 Downloader - Downloading from: ${vr.dlink}`);
          const response = await axios.get(vr.dlink, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);
          
          console.log('MP3 Downloader - Saving file...');
          const filePath = await this.saveToTemp(buffer, title);
          
          // Calculate file size in MB
          const fileSizeInBytes = buffer.length;
          const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
          
          console.log(`MP3 Downloader - Download complete. Size: ${fileSizeInMB}MB`);
          
          return {
            type: 'audio',
            quality: quality,
            title,
            thumbnail,
            filePath,
            fileSize: `${fileSizeInMB}MB`
          };
        } else {
          throw new Error(`No suitable audio format available.`);
        }
      } else {
        console.log(`MP3 Downloader - Found quality: ${quality}`);
        
        console.log('MP3 Downloader - Converting audio...');
        const vr = await this.convert(resultx.data.vid, vo.key);
        console.log('MP3 Downloader - Conversion response:', vr);
        
        if (vr.status !== 'ok' || !vr.dlink) {
          throw new Error('Conversion failed or download link not available');
        }
        
        console.log(`MP3 Downloader - Downloading from: ${vr.dlink}`);
        const response = await axios.get(vr.dlink, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        console.log('MP3 Downloader - Saving file...');
        const filePath = await this.saveToTemp(buffer, title);
        
        // Calculate file size in MB
        const fileSizeInBytes = buffer.length;
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
        
        console.log(`MP3 Downloader - Download complete. Size: ${fileSizeInMB}MB`);
        
        return {
          type: 'audio',
          quality: quality,
          title,
          thumbnail,
          filePath,
          fileSize: `${fileSizeInMB}MB`
        };
      }
    } catch (error: any) {
      console.error('MP3 Downloader Error:', error);
      throw error;
    }
  }
};

const Mp4 = {
  async main(link: string, format = 'mp4', quality = '720p'): Promise<{
    type: string;
    quality: string;
    title: string;
    thumbnail: string;
    downloadUrl: string;
    availableQualities: string[];
  }> {
    try {
      console.log(`MP4 Downloader - Started with link: ${link}, format: ${format}, quality: ${quality}`);

      // Get video info first
      const { title, thumbnail } = await BackupDownloader.getVideoInfo(link);
      const videoId = extractVideoId(link) || link;

      // Try friend's downloader first
      try {
        console.log('MP4 Downloader - Trying friend\'s downloader...');
        const result = await BackupDownloader.friendMP4Downloader(videoId, quality);
        
        return {
          type: 'video',
          quality: quality,
          title,
          thumbnail,
          downloadUrl: result.downloadUrl,
          availableQualities: ['240p', '360p', '480p', '720p', '1080p']
        };
      } catch (friendError) {
        console.log('Friend\'s downloader failed, trying fallback APIs...');
        
        // If friend's downloader fails, try fallback APIs
        const fallbackResult = await BackupDownloader.downloadMP4Fallback(videoId, quality);
        
        return {
          type: 'video',
          quality: quality,
          title,
          thumbnail,
          downloadUrl: fallbackResult.downloadUrl,
          availableQualities: ['240p', '360p', '480p', '720p', '1080p']
        };
      }
    } catch (error) {
      console.error('MP4 Downloader Error:', error);
      throw error;
    }
  }
};

// Update Mp3.main to use fallbacks if needed
const originalMp3Main = Mp3.main;
Mp3.main = async function(...args) {
  try {
    // First try the original implementation
    return await originalMp3Main.apply(this, args);
  } catch (error) {
    console.log('Original MP3 downloader failed, trying fallbacks...');
    
    const [link] = args;
    const videoId = extractVideoId(link) || link;
    const { title, thumbnail } = await BackupDownloader.getVideoInfo(link);

    // Try friend's downloader first
    try {
      const result = await BackupDownloader.friendMP3Downloader(videoId);
      
      // Download the file
      const response = await axios.get(result.downloadUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const filePath = await Mp3.saveToTemp(buffer, title);
      const fileSizeInMB = (buffer.length / (1024 * 1024)).toFixed(2);

      return {
        type: 'audio',
        quality: '128kbps',
        title,
        thumbnail,
        filePath,
        fileSize: `${fileSizeInMB}MB`
      };
    } catch (friendError) {
      console.log("Friend's MP3 downloader failed, trying other fallbacks...");
      
      // If friend's downloader fails, try other fallback APIs
      const fallbackResult = await BackupDownloader.downloadMP3Fallback(videoId);
      
      // Download the file
      const response = await axios.get(fallbackResult.downloadUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const filePath = await Mp3.saveToTemp(buffer, title);
      const fileSizeInMB = (buffer.length / (1024 * 1024)).toFixed(2);

      return {
        type: 'audio',
        quality: '128kbps',
        title,
        thumbnail,
        filePath,
        fileSize: `${fileSizeInMB}MB`
      };
    }
  }
};

export { Mp3, Mp4, BackupDownloader };
