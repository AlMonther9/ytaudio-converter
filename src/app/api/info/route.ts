import { NextRequest, NextResponse } from 'next/server';
import youtubedl from '@/utils/ytdl';

// Validate YouTube video URL and extract ID
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Validate YouTube playlist URL and extract list ID
function getYouTubePlaylistId(url: string): string | null {
  const regExp = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const playlistId = getYouTubePlaylistId(url);
    const videoId = getYouTubeId(url);

    // 1. Process Playlist if detected
    if (playlistId) {
      const cleanUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      console.log(`[API Info] Fetching playlist metadata for ${playlistId}`);

      const metadata = await youtubedl(cleanUrl, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      }) as any;

      if (!metadata) {
        return NextResponse.json({ error: 'Failed to retrieve playlist metadata' }, { status: 500 });
      }

      const entries = (metadata.entries || []).map((entry: any) => ({
        id: entry.id,
        title: entry.title || 'Unknown Title',
        duration: entry.duration || 0
      }));

      let thumbnail = '';
      if (metadata.thumbnails && metadata.thumbnails.length > 0) {
        thumbnail = metadata.thumbnails[metadata.thumbnails.length - 1]?.url || '';
      } else if (entries.length > 0) {
        thumbnail = `https://i.ytimg.com/vi/${entries[0].id}/hqdefault.jpg`;
      }

      return NextResponse.json({
        isPlaylist: true,
        id: playlistId,
        title: metadata.title || 'Unknown Playlist',
        uploader: metadata.uploader || metadata.channel || 'Unknown Channel',
        thumbnail: thumbnail,
        viewCount: metadata.view_count || 0,
        videoCount: entries.length,
        videos: entries.slice(0, 100) // Return up to first 100 items
      });
    }

    // 2. Fallback to Video if detected
    if (videoId) {
      const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`[API Info] Fetching video metadata for ${videoId}`);

      const metadata = await youtubedl(cleanUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      }) as any;

      if (!metadata) {
        return NextResponse.json({ error: 'Failed to retrieve video metadata' }, { status: 500 });
      }

      // Find the best thumbnail
      let thumbnail = metadata.thumbnail;
      if (metadata.thumbnails && metadata.thumbnails.length > 0) {
        const sortedThumbnails = [...metadata.thumbnails].sort((a: any, b: any) => {
          const aArea = (a.width || 0) * (a.height || 0);
          const bArea = (b.width || 0) * (b.height || 0);
          return bArea - aArea;
        });
        thumbnail = sortedThumbnails[0]?.url || thumbnail;
      }

      return NextResponse.json({
        isPlaylist: false,
        id: videoId,
        title: metadata.title || 'Unknown Video',
        duration: metadata.duration || 0,
        uploader: metadata.uploader || metadata.channel || 'Unknown Uploader',
        thumbnail: thumbnail || '',
        viewCount: metadata.view_count || 0,
        description: metadata.description ? (metadata.description.substring(0, 150) + '...') : '',
      });
    }

    return NextResponse.json({ error: 'Invalid YouTube Video or Playlist URL' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in info API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video details. Please check the URL and try again.',
      details: error.message || ''
    }, { status: 500 });
  }
}
