import { NextRequest, NextResponse } from 'next/server';
import youtubedl from '@/utils/ytdl';
import path from 'path';
import os from 'os';
import fs from 'fs';

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function GET(request: NextRequest) {
  let expectedMp3Path = '';
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const quality = searchParams.get('quality') || '0'; // Default best (VBR 0)

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const videoId = getYouTubeId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[API Download] Starting process for ${videoId} to MP3 (quality preset: ${quality})`);

    // 1. Fetch metadata to set a friendly output name
    const metadata = await youtubedl(cleanUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true
    }) as any;

    const rawTitle = metadata?.title || 'youtube-audio';
    // Strip forbidden Windows and Unix filename characters
    const safeTitle = rawTitle.replace(/[\\/*?:"<>|]/g, '').trim() || 'youtube-audio';

    // 2. Set up local destination folder (customizable via env, fallback to cross-platform Downloads folder)
    const targetDir = process.env.DOWNLOAD_DIR || path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputPattern = path.join(targetDir, `${safeTitle}.%(ext)s`);
    expectedMp3Path = path.join(targetDir, `${safeTitle}.mp3`);

    const isWin = os.platform() === 'win32';
    const ffmpegBinName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const resolvedFfmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegBinName);

    // 3. Download and convert to MP3 using yt-dlp and ffmpeg-static directly to target path
    await youtubedl(cleanUrl, {
      ffmpegLocation: `"${resolvedFfmpegPath}"`, // Quote the path to support spaces on Windows
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: parseInt(quality, 10),
      output: `"${outputPattern}"`, // Quote the output path to support spaces on Windows
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
      title: safeTitle,
      path: expectedMp3Path,
      size: fileStats.size
    });

  } catch (error: any) {
    console.error('[API Download] Process failed:', error);
    return NextResponse.json({ 
      error: 'Download or conversion failed. Please try again.',
      details: error.message || ''
    }, { status: 500 });
  }
}
