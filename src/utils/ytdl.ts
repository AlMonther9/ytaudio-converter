import { create } from 'youtube-dl-exec';
import path from 'path';
import os from 'os';

const isWin = os.platform() === 'win32';
const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const binPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', binName);

export const ytdl = create(binPath);
export default ytdl;
