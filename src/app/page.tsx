'use client';

import { useState, useEffect } from 'react';

interface DownloadTask {
  id: string;
  url: string;
  title: string;
  uploader: string;
  thumbnail: string;
  isPlaylist: boolean;
  duration?: number;
  videoCount?: number;
  videos?: Array<{ id: string; title: string; duration: number }>;
  status: 'fetching' | 'ready' | 'downloading' | 'completed' | 'error';
  errorMsg?: string;
  savedPath?: string;
  quality: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('0'); // 0 = best, 2 = high, 5 = medium, 7 = low
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  // Load tasks from localStorage on initial render for user convenience
  useEffect(() => {
    const saved = localStorage.getItem('ytaudio_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DownloadTask[];
        // Filter out stuck states and reset them to error or completed
        const cleaned = parsed.map(task => {
          if (task.status === 'fetching' || task.status === 'downloading') {
            return { 
              ...task, 
              status: 'error' as const, 
              errorMsg: 'Download interrupted.' 
            };
          }
          return task;
        });
        setTasks(cleaned);
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    }
  }, []);

  // Save tasks to localStorage when tasks state changes
  useEffect(() => {
    localStorage.setItem('ytaudio_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const tempId = Date.now().toString();
    const newTask: DownloadTask = {
      id: tempId,
      url: url.trim(),
      title: 'Validating and loading details...',
      uploader: 'YouTube Link',
      thumbnail: '',
      isPlaylist: false,
      status: 'fetching',
      quality: quality
    };

    setTasks(prev => [newTask, ...prev]);
    setUrl(''); // Clear input instantly so user can queue another url!
  };

  const handleUpdateTask = (id: string, updates: Partial<DownloadTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleClearFinished = () => {
    setTasks(prev => prev.filter(t => t.status !== 'completed' && t.status !== 'error'));
  };

  const qualities = [
    { value: '0', title: 'Best Quality (320kbps)', desc: 'High-fidelity audio preservation' },
    { value: '2', title: 'High Quality (256kbps)', desc: 'Optimal size and sound balance' },
    { value: '5', title: 'Standard Quality (192kbps)', desc: 'Fast conversion, decent fidelity' },
    { value: '7', title: 'Basic Quality (128kbps)', desc: 'Smallest file size, good for speech' }
  ];

  return (
    <main className="app-container">
      <div className="content-wrapper">
        <header className="app-header">
          <div className="logo-section" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg viewBox="0 0 200 50" width="160" height="40" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="50%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
                <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <g transform="translate(10, 5)">
                <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logo-grad)" strokeWidth="2.5" opacity="0.3" />
                <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logo-grad)" strokeWidth="2.5" strokeDasharray="30 15" filter="url(#logo-glow)" />
                <polygon points="17,14 26,20 17,26" fill="url(#logo-grad)" />
                <rect x="43" y="15" width="2.5" height="10" rx="1.25" fill="url(#logo-grad)" />
                <rect x="48" y="10" width="2.5" height="20" rx="1.25" fill="url(#logo-grad)" />
                <rect x="53" y="5" width="2.5" height="30" rx="1.25" fill="url(#logo-grad)" />
                <rect x="58" y="12" width="2.5" height="16" rx="1.25" fill="url(#logo-grad)" />
              </g>
              <text x="78" y="31" fontFamily="var(--font-sans)" fontWeight="800" fontSize="20" fill="#ffffff" letterSpacing="0.05em">
                YT<tspan fill="url(#logo-grad)">AUDIO</tspan>
              </text>
            </svg>
          </div>
          
          <h1 className="app-title">
            Parallel YouTube <br />
            <span className="title-gradient">Audio Downloader</span>
          </h1>
          <p className="app-subtitle">
            Paste links below to download and convert multiple audios in parallel directly to your PC.
          </p>
        </header>

        {/* Input Card */}
        <div className="glass-card main-card">
          <form onSubmit={handleAddTask} className="url-form">
            <div className="input-group">
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Paste YouTube video or playlist link..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={!url.trim()}
                style={{ minWidth: '150px' }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Queue Link
              </button>
            </div>
          </form>

          {/* Quality Selector */}
          <div className="quality-section" style={{ marginTop: '2.25rem', marginBottom: '0' }}>
            <span className="quality-label">Encoding Quality Preset</span>
            <div className="quality-grid">
              {qualities.map((item) => (
                <div
                  key={item.value}
                  onClick={() => setQuality(item.value)}
                  className={`quality-card ${quality === item.value ? 'active' : ''}`}
                >
                  <div className="quality-title">{item.title}</div>
                  <div className="quality-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Queue Section */}
        {tasks.length > 0 ? (
          <div className="tasks-container">
            <div className="tasks-header-bar">
              <span className="tasks-title-count">Downloads Queue ({tasks.length})</span>
              {tasks.some(t => t.status === 'completed' || t.status === 'error') && (
                <button 
                  className="clear-all-btn"
                  onClick={handleClearFinished}
                >
                  Clear Finished Tasks
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRemove={handleRemoveTask}
                  onUpdate={handleUpdateTask}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', marginTop: '2rem', color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            No active downloads in queue. Paste a link above to start parallel processing.
          </div>
        )}
      </div>
    </main>
  );
}

interface TaskCardProps {
  task: DownloadTask;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DownloadTask>) => void;
}

function TaskCard({ task, onRemove, onUpdate }: TaskCardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Steps definition based on whether it is a playlist or video
  const steps = task.isPlaylist
    ? [
        { title: 'Connecting', desc: 'Connecting to YouTube playlist' },
        { title: 'Downloading', desc: `Downloading all ${task.videoCount || 0} tracks` },
        { title: 'Converting', desc: 'Converting tracks to MP3' },
        { title: 'Finalizing', desc: 'Saving files to playlist directory' }
      ]
    : [
        { title: 'Connecting', desc: 'Initializing yt-dlp & FFmpeg' },
        { title: 'Downloading', desc: 'Extracting audio stream' },
        { title: 'Converting', desc: 'Transcoding to MP3' },
        { title: 'Saving', desc: 'Writing file directly to PC' }
      ];

  // Simulating/estimating step progress for better visual response
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (task.status === 'downloading') {
      setActiveStep(0);
      const runSteps = () => {
        timer = setTimeout(() => {
          setActiveStep(1); // Downloading
          timer = setTimeout(() => {
            setActiveStep(2); // Converting
            timer = setTimeout(() => {
              setActiveStep(3); // Saving / Finalizing
            }, task.isPlaylist ? 35000 : 12000);
          }, task.isPlaylist ? 25000 : 8000);
        }, task.isPlaylist ? 5000 : 3000);
      };
      runSteps();
    } else if (task.status === 'completed') {
      setActiveStep(4);
    } else {
      setActiveStep(0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [task.status, task.isPlaylist]);

  // Main task execution lifecycle
  useEffect(() => {
    let isMounted = true;

    const executeTask = async () => {
      // 1. Fetch metadata if state is 'fetching'
      if (task.status === 'fetching') {
        try {
          const response = await fetch(`/api/info?url=${encodeURIComponent(task.url)}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch details');
          }

          if (isMounted) {
            onUpdate(task.id, {
              status: 'downloading',
              title: data.title,
              uploader: data.uploader,
              thumbnail: data.thumbnail,
              isPlaylist: !!data.isPlaylist,
              duration: data.duration,
              videoCount: data.videoCount,
              videos: data.videos
            });
          }
        } catch (err: any) {
          if (isMounted) {
            onUpdate(task.id, {
              status: 'error',
              errorMsg: err.message || 'Verification failed. Please check link.'
            });
          }
        }
      }

      // 2. Perform download if state is 'downloading'
      if (task.status === 'downloading') {
        try {
          const response = await fetch(`/api/download?url=${encodeURIComponent(task.url)}&quality=${task.quality}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Download failed');
          }

          if (isMounted) {
            onUpdate(task.id, {
              status: 'completed',
              savedPath: data.path
            });
          }
        } catch (err: any) {
          if (isMounted) {
            onUpdate(task.id, {
              status: 'error',
              errorMsg: err.message || 'Download and conversion process failed.'
            });
          }
        }
      }
    };

    executeTask();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.status]); // Keep execution scoped directly to state transitions

  const getProgressPercentage = () => {
    if (task.status === 'fetching') return 15;
    if (task.status === 'ready') return 30;
    if (task.status === 'downloading') {
      return 35 + (activeStep * 15); // ranges from 35% to 80%
    }
    if (task.status === 'completed') return 100;
    return 0;
  };

  const getProgressDescription = () => {
    if (task.status === 'fetching') return 'Validating and fetching details...';
    if (task.status === 'downloading') {
      return steps[activeStep]?.desc || 'Processing...';
    }
    if (task.status === 'completed') {
      return task.isPlaylist ? 'Playlist saved successfully!' : 'MP3 saved successfully!';
    }
    if (task.status === 'error') return task.errorMsg || 'An error occurred';
    return '';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card task-card" style={{ 
      borderColor: task.status === 'completed' 
        ? 'rgba(16, 185, 129, 0.2)' 
        : task.status === 'error'
          ? 'rgba(239, 68, 68, 0.2)'
          : undefined
    }}>
      <div className="task-thumbnail-container">
        {task.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={task.thumbnail} alt={task.title} className="task-thumb-img" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div className="glow-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          </div>
        )}
        <span className="task-duration-badge">
          {task.isPlaylist ? `${task.videoCount || 0} Videos` : formatDuration(task.duration)}
        </span>
      </div>

      <div className="task-details">
        <h3 className="task-title" title={task.title}>
          {task.title}
        </h3>
        <div className="task-meta">
          <span>{task.uploader || 'YouTube'}</span>
          <span>•</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
            Quality: {task.quality === '0' ? '320k' : task.quality === '2' ? '256k' : task.quality === '5' ? '192k' : '128k'}
          </span>
        </div>

        {task.isPlaylist && task.status === 'downloading' && task.videos && (
          <div className="playlist-tracks-preview" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>
            <div className="playlist-tracks-list" style={{ maxHeight: '80px', gap: '0.25rem' }}>
              {task.videos.slice(0, 3).map((track, i) => (
                <div key={track.id} className="playlist-track-item" style={{ fontSize: '0.75rem', paddingBottom: '0.15rem' }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                    {i + 1}. {track.title}
                  </span>
                  <span style={{ opacity: 0.6 }}>{formatDuration(track.duration)}</span>
                </div>
              ))}
              {task.videoCount && task.videoCount > 3 && (
                <div className="playlist-track-more" style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>
                  + {task.videoCount - 3} more tracks...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="task-status-row">
          <span className={`status-badge ${task.status}`}>
            {task.status}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8, color: task.status === 'error' ? 'var(--error)' : 'var(--text-muted)' }}>
            {getProgressDescription()}
          </span>
        </div>

        {task.status !== 'error' && (
          <div className="task-progress-bar-bg">
            <div 
              className="task-progress-bar-fg" 
              style={{ 
                width: `${getProgressPercentage()}%`,
                background: task.status === 'completed' ? 'var(--success)' : undefined
              }}
            ></div>
          </div>
        )}

        {task.status === 'completed' && task.savedPath && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            Saved: <code style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>{task.savedPath}</code>
          </div>
        )}
      </div>

      <div className="task-actions">
        {task.status === 'error' && (
          <button 
            className="task-btn" 
            title="Retry download"
            onClick={() => onUpdate(task.id, { status: 'fetching', errorMsg: undefined })}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
            </svg>
          </button>
        )}
        <button 
          className="task-btn delete" 
          title="Remove task"
          onClick={() => onRemove(task.id)}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
