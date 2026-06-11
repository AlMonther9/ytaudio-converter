import { NextRequest, NextResponse } from 'next/server';
import youtubedl from '@/utils/ytdl';

// Validate YouTube URL and extract ID
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const videoId = getYouTubeId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Clean YouTube URL to avoid command-line injection and redirect concerns
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Get metadata from yt-dlp
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
      // Find the highest resolution thumbnail or fallback to the last one
      const sortedThumbnails = [...metadata.thumbnails].sort((a: any, b: any) => {
        const aArea = (a.width || 0) * (a.height || 0);
        const bArea = (b.width || 0) * (b.height || 0);
        return bArea - aArea;
      });
      thumbnail = sortedThumbnails[0]?.url || thumbnail;
    }

    return NextResponse.json({
      id: videoId,
      title: metadata.title || 'Unknown Video',
      duration: metadata.duration || 0,
      uploader: metadata.uploader || metadata.channel || 'Unknown Uploader',
      thumbnail: thumbnail || '',
      viewCount: metadata.view_count || 0,
      description: metadata.description ? (metadata.description.substring(0, 150) + '...') : '',
    });
  } catch (error: any) {
    console.error('Error in info API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video details. Please check the URL and try again.',
      details: error.message || ''
    }, { status: 500 });
  }
}
