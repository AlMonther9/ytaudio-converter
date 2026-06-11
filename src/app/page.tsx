'use client';

import { useState, useEffect } from 'react';

interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
  viewCount: number;
  description: string;
}

type DownloadState = 'idle' | 'fetching_info' | 'ready' | 'downloading' | 'completed' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [quality, setQuality] = useState('0'); // 0 = best, 2 = high, 5 = medium, 7 = low
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [savedPath, setSavedPath] = useState('');

  // Steps shown in the downloader progress panel
  const steps = [
    { title: 'Initializing Engine', desc: 'Starting yt-dlp & FFmpeg instance' },
    { title: 'Fetching Audio Stream', desc: 'Extracting audio channels from YouTube' },
    { title: 'Converting to MP3', desc: 'Muxing & encoding high-fidelity audio' },
    { title: 'Transmitting File', desc: 'Delivering final MP3 to your device' }
  ];

  // Simulating/estimating backend download progress steps for better UX
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (downloadState === 'downloading') {
      setActiveStep(0);
      
      const runSteps = () => {
        timer = setTimeout(() => {
          setActiveStep(1); // Fetching audio stream
          
          timer = setTimeout(() => {
            setActiveStep(2); // Converting to MP3
            
            timer = setTimeout(() => {
              setActiveStep(3); // Transmitting file
            }, 12000);
          }, 8000);
        }, 3000);
      };
      
      runSteps();
    } else {
      setActiveStep(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [downloadState]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format view count nicely
  const formatViews = (views: number) => {
    if (!views) return '0 views';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setErrorMsg(null);
    setVideoInfo(null);
    setDownloadState('fetching_info');

    try {
      const response = await fetch(`/api/info?url=${encodeURIComponent(url.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video details.');
      }

      setVideoInfo(data);
      setDownloadState('ready');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve video details. Please verify the link.');
      setDownloadState('error');
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !videoInfo) return;

    setErrorMsg(null);
    setDownloadState('downloading');

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}&quality=${quality}`;
      const response = await fetch(downloadUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download and convert the audio.');
      }

      setSavedPath(data.path);
      setDownloadState('completed');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during the download process.');
      setDownloadState('error');
    }
  };

  const resetApp = () => {
    setUrl('');
    setVideoInfo(null);
    setErrorMsg(null);
    setSavedPath('');
    setDownloadState('idle');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">YTAudio</h1>
        <p className="app-subtitle">
          Download high-quality YouTube videos directly as MP3 audio files. Ad-free, fast, and secure.
        </p>
      </header>

      <main className="glass-card">
        {/* Error Banner */}
        {errorMsg && (
          <div className="error-banner">
            <svg className="error-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong>Error:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Input Form (visible on idle, ready, error, fetching) */}
        {downloadState !== 'downloading' && downloadState !== 'completed' && (
          <form onSubmit={handleFetchInfo} className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="Paste YouTube video or shorts link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={downloadState === 'fetching_info'}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={downloadState === 'fetching_info' || !url.trim()}
            >
              {downloadState === 'fetching_info' ? (
                <>
                  <svg className="spin" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Load Video
                </>
              )}
            </button>
          </form>
        )}

        {/* Quality preset settings selector */}
        {downloadState === 'ready' && videoInfo && (
          <div className="quality-section">
            <span className="quality-label">Choose Audio Quality</span>
            <div className="quality-grid">
              {[
                { value: '0', title: 'Best', desc: '320 kbps VBR' },
                { value: '2', title: 'High', desc: '256 kbps' },
                { value: '5', title: 'Standard', desc: '192 kbps' },
                { value: '7', title: 'Basic', desc: '128 kbps' }
              ].map((item) => (
                <div
                  key={item.value}
                  className={`quality-card ${quality === item.value ? 'active' : ''}`}
                  onClick={() => setQuality(item.value)}
                >
                  <div className="quality-title">{item.title}</div>
                  <div className="quality-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Preview & Options */}
        {downloadState === 'ready' && videoInfo && (
          <div className="preview-container">
            <div className="preview-thumbnail-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="preview-thumbnail"
              />
              <span className="preview-duration">{formatDuration(videoInfo.duration)}</span>
            </div>
            <div className="preview-info">
              <div>
                <h2 className="preview-title" title={videoInfo.title}>
                  {videoInfo.title}
                </h2>
                <div className="preview-channel">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {videoInfo.uploader}
                </div>
                <div className="preview-views">
                  {formatViews(videoInfo.viewCount)}
                </div>
              </div>
              
              <div className="action-section">
                <button className="download-btn" onClick={handleDownload}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Convert & Download MP3
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Downloading state with step tracking */}
        {downloadState === 'downloading' && (
          <div className="loader-container">
            <div className="glow-spinner"></div>
            <div className="loader-status">
              Processing Audio Conversion...
            </div>
            <div className="loader-steps">
              {steps.map((step, idx) => {
                let statusClass = '';
                if (idx < activeStep) statusClass = 'completed';
                else if (idx === activeStep) statusClass = 'active';

                return (
                  <div key={idx} className={`step-item ${statusClass}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="step-bullet"></span>
                      <div style={{ textAlign: 'left' }}>
                        <div>{step.title}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{step.desc}</div>
                      </div>
                    </div>
                    {idx < activeStep && (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed State */}
        {downloadState === 'completed' && videoInfo && (
          <div className="loader-container" style={{ padding: '3rem 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '2px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
              animation: 'scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Conversion Complete!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your high-quality MP3 has been saved directly on your PC.</p>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(150, 120, 220, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
              maxWidth: '450px',
              width: '100%',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{videoInfo.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Uploader: {videoInfo.uploader}</div>
              <div style={{ borderTop: '1px solid rgba(150, 120, 220, 0.08)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>Saved Destination</span>
                <code style={{ fontSize: '0.8rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{savedPath}</code>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={resetApp}
              style={{ marginTop: '1rem', padding: '1rem 2.5rem' }}
            >
              Convert Another Video
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>YTAudio &copy; {new Date().getFullYear()} &bull; Built with Node.js, Next.js & TypeScript</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          Please ensure you only download content you have the right to access.
        </p>
      </footer>
    </div>
  );
}
