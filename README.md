I built this one for my personal use to download audio files from Youtube in high quality. :3

# YTAudio - Premium YouTube to MP3 Converter 🎵

YTAudio is a high-performance, self-hosted YouTube-to-MP3 converter web application. Built using Next.js 16 (App Router), TypeScript, and custom glassmorphic styling, it allows you to retrieve metadata and extract high-fidelity audio tracks directly to your local machine without advertisements, tracking, or rate-limiting.

---

- **Parallel Multi-Task Queueing**: Submit multiple video or playlist URLs concurrently. The input field clears immediately so you can queue another URL while active processes run in parallel.
- **Glassmorphic Dark UI**: A premium visual interface featuring a violet-pink palette, smooth animations, and independent step-by-step conversion progress trackers for each download task.
- **Metadata Preview Card**: Automatically parses YouTube URLs, retrieving video/shorts details (high-res thumbnail, title, channel name, duration) and listing playlist tracks.
- **Variable Bitrate Presets**: Select from multiple audio encoding presets:
  - **Best**: 320 kbps VBR (Variable Bit Rate)
  - **High**: 256 kbps
  - **Standard**: 192 kbps
  - **Basic**: 128 kbps
- **Direct Local Storage Save**: Saves converted files directly to your local PC (defaults to your standard system `Downloads` folder, customizable via environment variables) without holding large files in browser memory or triggering prompt boxes.
- **Zero Manual Setup**: Uses programmatically managed local binaries for `yt-dlp` and `ffmpeg` (via `youtube-dl-exec` and `ffmpeg-static`), removing the need for manual system path variables or environment configuration.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Vanilla CSS (Custom Variable tokens).
- **Backend**: Next.js API Routes (Node.js runtime).
- **Core Downloader**: Programmatic [yt-dlp](https://github.com/yt-dlp/yt-dlp) instance wrapper.
- **Audio Transcoder**: [FFmpeg](https://ffmpeg.org/) via static local binaries.

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have **Node.js** (v18.x or v20.x+) installed.

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/youtube-mp3-downloader.git
cd youtube-mp3-downloader
npm install
```

### 3. Run Development Server

Start the Next.js server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

To build the optimized production bundle:

```bash
npm run build
npm run start
```

---

## ⚙️ Configuration

By default, files are saved directly to your system's default `Downloads` directory. To customize the download destination folder, create a `.env.local` file in the root of the project and define the `DOWNLOAD_DIR` variable:

```env
# Example for Windows (use double backslashes)
DOWNLOAD_DIR="K:\\A B D"

# Example for macOS/Linux
DOWNLOAD_DIR="/Users/yourname/Music"
```

---

## 🛡️ License & Disclaimer

This project is intended for educational and personal archive purposes. Please ensure you only download audio/video content for which you own the rights or have explicit permission from the copyright holder.

---

Built with ❤️ using Next.js & TypeScript
