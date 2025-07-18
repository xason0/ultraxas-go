import yts from 'yt-search';
import { MediaItem, VideoDetails } from '@/types';

// Trending categories list
const TRENDING_CATEGORIES = [
  'Movies Trading Latest',
  'Series Trading Latest',
  'Sports 2025 Highlights & News',
  'Tranding songs hip hop afro beat',
  'Hacking & Gadgets 2025 & Technology ',
  'Hot Girls / Beauty Vlogs / Fashion',
  'best songs all time',
  'Comedy (Kenya, Nigeria, Global Skits)',
  'Bongo Tanzania kenya',
  'Trending Music Videos & Songs',
  'BWM XMD QUANTUM WhatsApp bot',
  'Best of kenyan songs ',
  'Ibrahimaitech (Tech Tutorials & Reviews)',
  'Reggae & Spanish songs',
  'Gaming (GTA 6, Fortnite, EA FC 25)',
  'TikTok Viral Challenges & Shorts',
  'Workout & Fitness Vlogs',
  'Pranks & Public Reactions',
  'Luxury Lifestyle & Richest People',
  'Top 10 & Top 5 Countdown Videos',
  'Unboxing & Product Reviews',
  'Classic cars model electric'
];

const MUSIC_CATEGORIES = [
  'Trending Music Videos & Songs',
  'Latest Hits 2025',
  'Afrobeats 2025',
  'Best of kenyan songs ',
  'Abatone kenya',
  'Bongo Tanzania kenya',
  'reggae',
  'drills',
  'best songs all time',
  'love songs',
  'Hip Hop 2025',
  'Pop Music 2025',
  'Amapiano 2025'
];

// Store recent searches (in real app, use localStorage or database)
let recentSearches = [];
let searchHistory = new Map(); // Store search results for faster access

// Related terms mapping for better suggestions
const RELATED_TERMS = {
  'music': ['songs', 'beats', 'audio', 'playlist', 'album', 'artist'],
  'movie': ['film', 'cinema', 'trailer', 'review', 'scene', 'actor'],
  'game': ['gaming', 'gameplay', 'review', 'trailer', 'tips', 'walkthrough'],
  'tech': ['technology', 'gadget', 'review', 'unbox', 'tutorial', 'news'],
  'comedy': ['funny', 'laugh', 'joke', 'skit', 'prank', 'humor'],
  'sports': ['football', 'basketball', 'soccer', 'highlights', 'match', 'goal'],
  'dance': ['choreography', 'moves', 'tutorial', 'performance', 'rhythm'],
  'food': ['cooking', 'recipe', 'chef', 'kitchen', 'taste', 'restaurant'],
  'travel': ['vacation', 'destination', 'tour', 'adventure', 'explore', 'journey'],
  'fashion': ['style', 'outfit', 'trend', 'beauty', 'makeup', 'clothing']
};

// Search for videos on YouTube with recent search tracking
export async function searchYoutube(query, trackSearch = true) {
  try {
    // Track this search
    if (trackSearch) {
      addToRecentSearches(query);
    }
    
    const results = await yts(query);
    
    if (!results || !results.videos || results.videos.length === 0) {
      return [];
    }
    
    const searchResults = results.videos.slice(0, 10).map(video => ({
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: formatViewCount(video.views),
      duration: video.timestamp,
      type: 'video',
      searchQuery: query // Track what search led to this result
    }));
    
    // Cache results for related content
    if (trackSearch) {
      searchHistory.set(query.toLowerCase(), searchResults);
    }
    
    return searchResults;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw new Error('Failed to search YouTube');
  }
}

// Get content related to recent searches
export async function getRelatedToRecentSearches() {
  try {
    if (recentSearches.length === 0) {
      // If no recent searches, return trending content
      return await getTrendingVideos(false);
    }
    
    // Get the most recent search
    const mostRecentSearch = recentSearches[0];
    
    // First try to get cached results
    const cachedResults = searchHistory.get(mostRecentSearch.toLowerCase());
    if (cachedResults && cachedResults.length > 0) {
      return cachedResults.slice(0, 6);
    }
    
    // Generate related search terms
    const relatedTerms = generateRelatedTerms(mostRecentSearch);
    const relatedQueries = [];
    
    // Add variations of recent search
    relatedQueries.push(`${mostRecentSearch} 2025`);
    relatedQueries.push(`best ${mostRecentSearch}`);
    relatedQueries.push(`${mostRecentSearch} latest`);
    
    // Add related terms
    relatedTerms.forEach(term => {
      relatedQueries.push(term);
      relatedQueries.push(`${mostRecentSearch} ${term}`);
    });
    
    // Search for related content
    const allRelatedResults = [];
    
    for (let i = 0; i < Math.min(relatedQueries.length, 3); i++) {
      try {
        const relatedResults = await searchYoutube(relatedQueries[i], false);
        allRelatedResults.push(...relatedResults.slice(0, 3));
      } catch (error) {
        console.error(`Error searching for related term: ${relatedQueries[i]}`, error);
      }
    }
    
    // Remove duplicates and return
    const uniqueResults = removeDuplicates(allRelatedResults);
    return uniqueResults.slice(0, 8);
    
  } catch (error) {
    console.error('Error getting related content:', error);
    // Fallback to trending if error
    return await getTrendingVideos(false);
  }
}

// Get recommended videos based on recent activity
export async function getSmartRecommendations() {
  try {
    if (recentSearches.length === 0) {
      return await getTrendingVideos(true);
    }
    
    // Analyze recent searches to determine user interests
    const userInterests = analyzeUserInterests();
    const recommendationQueries = [];
    
    // Generate smart recommendations based on interests
    userInterests.forEach(interest => {
      const matchingCategories = TRENDING_CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(interest.toLowerCase())
      );
      
      if (matchingCategories.length > 0) {
        recommendationQueries.push(matchingCategories[0]);
      } else {
        // Generate related content
        const relatedTerms = generateRelatedTerms(interest);
        relatedTerms.slice(0, 2).forEach(term => {
          recommendationQueries.push(term);
        });
      }
    });
    
    // Add some trending content for variety
    const randomTrending = TRENDING_CATEGORIES[Math.floor(Math.random() * TRENDING_CATEGORIES.length)];
    recommendationQueries.push(randomTrending);
    
    // Search for recommendations
    const allRecommendations = [];
    
    for (let i = 0; i < Math.min(recommendationQueries.length, 3); i++) {
      try {
        const results = await searchYoutube(recommendationQueries[i], false);
        allRecommendations.push(...results.slice(0, 2));
      } catch (error) {
        console.error(`Error getting recommendations for: ${recommendationQueries[i]}`, error);
      }
    }
    
    const uniqueRecommendations = removeDuplicates(allRecommendations);
    return uniqueRecommendations.slice(0, 6);
    
  } catch (error) {
    console.error('Error getting smart recommendations:', error);
    return await getTrendingVideos(true);
  }
}

// Get trending videos (updated to include smart content)
export async function getTrendingVideos(isRecommended = false) {
  try {
    // If user has recent searches, mix trending with related content
    if (recentSearches.length > 0 && Math.random() > 0.5) {
      const relatedContent = await getRelatedToRecentSearches();
      if (relatedContent.length > 0) {
        return relatedContent;
      }
    }
    
    const randomTerm = TRENDING_CATEGORIES[Math.floor(Math.random() * TRENDING_CATEGORIES.length)];
    const results = await yts(randomTerm);
    
    if (!results || !results.videos || results.videos.length === 0) {
      return [];
    }
    
    const limit = isRecommended ? 6 : 8;
    
    return results.videos.slice(0, limit).map(video => ({
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: formatViewCount(video.views),
      duration: video.timestamp,
      type: 'video'
    }));
  } catch (error) {
    console.error('Error getting trending videos:', error);
    throw new Error('Failed to get trending videos');
  }
}

// Get trending music (updated with smart suggestions)
export async function getTrendingMusic() {
  try {
    // Check if user searched for music-related content recently
    const musicSearches = recentSearches.filter(search => 
      search.toLowerCase().includes('music') || 
      search.toLowerCase().includes('song') ||
      search.toLowerCase().includes('audio') ||
      search.toLowerCase().includes('beat')
    );
    
    let searchTerm;
    
    if (musicSearches.length > 0) {
      // Use music-related recent search
      const recentMusicSearch = musicSearches[0];
      const relatedMusicTerms = generateRelatedTerms(recentMusicSearch);
      searchTerm = relatedMusicTerms.length > 0 ? relatedMusicTerms[0] : recentMusicSearch;
    } else {
      // Use random music category
      searchTerm = MUSIC_CATEGORIES[Math.floor(Math.random() * MUSIC_CATEGORIES.length)];
    }
    
    const results = await yts(searchTerm);
    
    if (!results || !results.videos || results.videos.length === 0) {
      return [];
    }
    
    return results.videos.slice(0, 8).map(video => ({
      id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: formatViewCount(video.views),
      duration: video.timestamp,
      type: 'audio'
    }));
  } catch (error) {
    console.error('Error getting trending music:', error);
    throw new Error('Failed to get trending music');
  }
}

// Get video details by ID
export async function getVideoInfo(videoId) {
  try {
    const results = await yts({ videoId });
    
    if (!results) {
      throw new Error('Video not found');
    }
    
    return {
      id: results.videoId,
      title: results.title,
      thumbnail: results.thumbnail,
      duration: results.timestamp,
      author: results.author.name,
      views: formatViewCount(results.views),
      url: results.url
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw new Error('Failed to get video info');
  }
}

// Get recent searches
export function getRecentSearches() {
  return [...recentSearches];
}

// Clear recent searches
export function clearRecentSearches() {
  recentSearches = [];
  searchHistory.clear();
}

// Get available download formats for a video
export async function getDownloadFormats(videoId) {
  try {
    return {
      video: [
        { quality: '480p', format: 'mp4', size: '30MB' },
        { quality: '720p', format: 'mp4', size: '60MB' },
        { quality: '1080p', format: 'mp4', size: '120MB' }
      ],
      audio: [
        { quality: '128kbps', format: 'mp3', size: '5MB' }
      ]
    };
  } catch (error) {
    console.error('Error getting download formats:', error);
    throw new Error('Failed to get download formats');
  }
}

// HELPER FUNCTIONS

// Add search to recent searches
function addToRecentSearches(query) {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Remove if already exists
  recentSearches = recentSearches.filter(search => search.toLowerCase() !== normalizedQuery);
  
  // Add to beginning
  recentSearches.unshift(query.trim());
  
  // Keep only last 10 searches
  if (recentSearches.length > 10) {
    recentSearches = recentSearches.slice(0, 10);
  }
}

// Generate related terms based on search query
function generateRelatedTerms(query) {
  const normalizedQuery = query.toLowerCase();
  const relatedTerms = [];
  
  // Check if query matches any category in RELATED_TERMS
  for (const [category, terms] of Object.entries(RELATED_TERMS)) {
    if (normalizedQuery.includes(category)) {
      relatedTerms.push(...terms);
    }
  }
  
  // Add variations
  relatedTerms.push(`${query} tutorial`);
  relatedTerms.push(`${query} review`);
  relatedTerms.push(`${query} compilation`);
  relatedTerms.push(`${query} highlights`);
  
  // Remove duplicates and shuffle
  const uniqueTerms = [...new Set(relatedTerms)];
  return shuffleArray(uniqueTerms).slice(0, 5);
}

// Analyze user interests from recent searches
function analyzeUserInterests() {
  if (recentSearches.length === 0) return [];
  
  const interests = new Map();
  
  recentSearches.forEach(search => {
    const words = search.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 3) { // Ignore small words
        interests.set(word, (interests.get(word) || 0) + 1);
      }
    });
  });
  
  // Sort by frequency and return top interests
  return Array.from(interests.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

// Remove duplicate videos by ID
function removeDuplicates(videos) {
  const seen = new Set();
  return videos.filter(video => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
}

// Shuffle array utility
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to format view count
function formatViewCount(views) {
  if (views >= 1000000000) {
    return (views / 1000000000).toFixed(1) + 'B';
  } else if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  } else {
    return views.toString();
  }
}
