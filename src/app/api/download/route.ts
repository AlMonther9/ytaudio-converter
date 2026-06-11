import { NextRequest, NextResponse } from 'next/server';
import youtubedl from '@/utils/ytdl';
import path from 'path';
import os from 'os';
import fs from 'fs';

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
    const quality = searchParams.get('quality') || '0'; // Default best (VBR 0)

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const playlistId = getYouTubePlaylistId(url);
    const videoId = getYouTubeId(url);

    const isWin = os.platform() === 'win32';
    const ffmpegBinName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const resolvedFfmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegBinName);

    // 1. Process Playlist if detected
    if (playlistId) {
      const cleanUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      console.log(`[API Download] Starting playlist process for ${playlistId} to MP3 (quality preset: ${quality})`);

      // Fetch playlist metadata to get the title
      const metadata = await youtubedl(cleanUrl, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noCheckCertificates: true,
        noWarnings: true
      }) as any;

      if (!metadata) {
        return NextResponse.json({ error: 'Failed to retrieve playlist metadata' }, { status: 500 });
      }

      const playlistTitle = metadata?.title || 'youtube-playlist';
      const safePlaylistTitle = playlistTitle.replace(/[\\/*?:"<>|]/g, '').trim() || 'youtube-playlist';

      // Create a subfolder for this playlist inside download destination
      const baseDir = process.env.DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads');
      const targetDir = path.join(baseDir, safePlaylistTitle);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Output pattern uses %(title)s template to name each video dynamically
      const outputPattern = path.join(targetDir, '%(title)s.%(ext)s');

      await youtubedl(cleanUrl, {
        ffmpegLocation: `"${resolvedFfmpegPath}"`, // Quote the path to support spaces on Windows
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: parseInt(quality, 10),
        output: `"${outputPattern}"`, // Quote output pattern to support spaces on Windows
        noCheckCertificates: true,
        noWarnings: true
      });

      console.log(`[API Download] Playlist "${playlistTitle}" successfully processed & saved at ${targetDir}`);

      return NextResponse.json({
        success: true,
        isPlaylist: true,
        title: playlistTitle,
        path: targetDir,
        count: metadata.entries?.length || 0
      });
    }

    // 2. Fallback to Video if detected
    if (videoId) {
      const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`[API Download] Starting video process for ${videoId} to MP3 (quality preset: ${quality})`);

      // Fetch metadata to set a friendly output name
      const metadata = await youtubedl(cleanUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true
      }) as any;

      const rawTitle = metadata?.title || 'youtube-audio';
      const safeTitle = rawTitle.replace(/[\\/*?:"<>|]/g, '').trim() || 'youtube-audio';

      const baseDir = process.env.DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads');
      const targetDir = baseDir;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const outputPattern = path.join(targetDir, `${safeTitle}.%(ext)s`);
      const expectedMp3Path = path.join(targetDir, `${safeTitle}.mp3`);

      // Download and convert to MP3
      await youtubedl(cleanUrl, {
        ffmpegLocation: `"${resolvedFfmpegPath}"`,
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: parseInt(quality, 10),
        output: `"${outputPattern}"`,
        noCheckCertificates: true,
        noWarnings: true
      });

      if (!fs.existsSync(expectedMp3Path)) {
        console.error(`[API Download] Expected MP3 file not found at ${expectedMp3Path}`);
        return NextResponse.json({ error: 'Failed to extract MP3 audio' }, { status: 500 });
      }

      const fileStats = fs.statSync(expectedMp3Path);
      console.log(`[API Download] MP3 file saved successfully at ${expectedMp3Path} (${fileStats.size} bytes).`);

      return NextResponse.json({
        success: true,
        isPlaylist: false,
        title: safeTitle,
        path: expectedMp3Path,
        size: fileStats.size
      });
    }

    return NextResponse.json({ error: 'Invalid YouTube Video or Playlist URL' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Download] Process failed:', error);
    return NextResponse.json({ 
      error: 'Download or conversion failed. Please try again.',
      details: error.message || ''
    }, { status: 500 });
  }
}
