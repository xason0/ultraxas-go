import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { getVideoInfo } from './youtube';

const execPromise = util.promisify(exec);

// Create temp directory for downloads
const DOWNLOADS_DIR = path.join(os.tmpdir(), 'bwm-xmd-downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Simulate video download (in a real app, this would use ytdl or similar)
export async function downloadVideo(videoId: string, quality: string) {
  try {
    // Get video info to get title for filename
    const videoInfo = await getVideoInfo(videoId);
    const sanitizedTitle = videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    
    // Simulate download delay based on quality
    const delay = quality === '1080p' ? 3000 : quality === '720p' ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Get a file with right quality marker
    const filePath = path.join(DOWNLOADS_DIR, `${sanitizedTitle}_${quality}.mp4`);
    
    // Create an empty file (in a real app, this would be the downloaded video)
    fs.writeFileSync(filePath, '');
    
    // Calculate file size based on quality
    const fileSize = quality === '1080p' ? '120MB' : quality === '720p' ? '60MB' : '30MB';
    
    return {
      filePath,
      fileSize,
    };
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error('Failed to download video');
  }
}

// Simulate audio download
export async function downloadAudio(videoId: string) {
  try {
    // Get video info to get title for filename
    const videoInfo = await getVideoInfo(videoId);
    const sanitizedTitle = videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get file path
    const filePath = path.join(DOWNLOADS_DIR, `${sanitizedTitle}.mp3`);
    
    // Create an empty file (in a real app, this would be the downloaded audio)
    fs.writeFileSync(filePath, '');
    
    return {
      filePath,
      fileSize: '5MB',
    };
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw new Error('Failed to download audio');
  }
}

// Clean up old downloads (call this periodically)
export function cleanupDownloads() {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than 30 minutes
      if (now - stats.mtime.getTime() > 30 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error cleaning up downloads:', error);
  }
}
