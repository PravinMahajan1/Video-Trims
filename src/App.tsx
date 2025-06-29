import { useRef, useState } from 'react';
import './App.css';

const BRAND_LOGO = '/brand-logo.png';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentFolder, setSegmentFolder] = useState<string | null>(null);
  const [segmentTime, setSegmentTime] = useState<number>(60);
  const [segmentUnit, setSegmentUnit] = useState<'seconds' | 'minutes'>('seconds');
  const [navOpen, setNavOpen] = useState(false);
  const [page, setPage] = useState<'dashboard' | 'myvideos' | 'settings'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [quality, setQuality] = useState<'1080p' | '4k'>('1080p');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Add theme class to body
  if (typeof document !== 'undefined') {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }

  const handleSegment = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError(null);
    setSegments([]);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('segmentTime', String(segmentUnit === 'minutes' ? segmentTime * 60 : segmentTime));
      const res = await fetch('https://simpleclips.onrender.com/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setSegments(data.segments.map((url: string) => `https://simpleclips.onrender.com${url}`));
      if (data.segments.length > 0) {
        const match = data.segments[0].match(/\/segments\/(.*?)\//);
        setSegmentFolder(match ? match[1] : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSegments([]);
    setError(null);
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      setError('Please select a valid video file.');
      setVideoFile(null);
    }
  };

  return (
    <div>
      <div className="brand-bar">
        <div className="brand-logo">
          <img src={BRAND_LOGO} alt="Logo" style={{height: 36, width: 36, borderRadius: 8, marginRight: 10}} /> Simpleclips
        </div>
        <button className="nav-toggle" onClick={() => setNavOpen(!navOpen)}>
          <span className="nav-toggle-bar"></span>
          <span className="nav-toggle-bar"></span>
          <span className="nav-toggle-bar"></span>
        </button>
        <nav className={`brand-nav${navOpen ? ' open' : ''}`}>
          <a href="#" className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>Dashboard</a>
          <a href="#" className={page === 'myvideos' ? 'active' : ''} onClick={() => setPage('myvideos')}>My Videos</a>
          <div className="settings-dropdown-wrapper">
            <a href="#" className={page === 'settings' ? 'active' : ''} onClick={e => { e.preventDefault(); setSettingsOpen(v => !v); }}>Settings</a>
            {settingsOpen && (
              <div className="settings-dropdown">
                <div className="settings-group">
                  <label>Theme:</label>
                  <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="settings-group">
                  <label>Video Quality:</label>
                  <select value={quality} onChange={e => setQuality(e.target.value as '1080p' | '4k')}>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                </div>
                <div className="settings-note">(Quality selection is for UI only; backend support required for real quality change.)</div>
              </div>
            )}
          </div>
          <a href="#">Help</a>
        </nav>
      </div>
      {page === 'dashboard' && (
        <main className="main-content main-centered">
          <div style={{ display: 'flex', width: '100%' }}>
            <section className="upload-section">
              <div className="upload-box">
                <div className="upload-icon">📤</div>
                <div className="upload-instructions">Drag & Drop Your Videos Here or click to browse.</div>
                <input type="file" accept="video/*" onChange={handleFileChange} className="upload-input" />
                <button className="upload-btn" onClick={handleSegment} disabled={!videoFile || loading}>
                  {loading ? 'Processing...' : 'Upload & Trim Video'}
                </button>
                <div className="upload-support">Supported formats: MP4, MOV, AVI, WMV. Max file size: 5GB.</div>
                <div className="segment-options-ui">
                  <label>Segment Length:</label>
                  <input
                    type="number"
                    min={1}
                    value={segmentTime}
                    onChange={e => setSegmentTime(Number(e.target.value))}
                    style={{ width: 60, marginLeft: 8, marginRight: 8 }}
                  />
                  <select value={segmentUnit} onChange={e => setSegmentUnit(e.target.value as 'seconds' | 'minutes')}>
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>
                {error && <div className="error">{error}</div>}
                {videoFile && (
                  <div className="video-preview">
                    <video ref={videoRef} src={URL.createObjectURL(videoFile)} controls width={320} />
                  </div>
                )}
              </div>
            </section>
            <aside className="right-clips-panel">
              <section className="recent-clips">
                <h3>Generated Clips</h3>
                <div className="clips-grid">
                  {segments.length === 0 && <div className="no-clips">No segments yet. Upload and trim a video.</div>}
                  {segments.map((url, idx) => (
                    <div className="clip-card" key={idx}>
                      <div className="clip-thumb">
                        <video src={url} width={200} height={110} controls />
                      </div>
                      <div className="clip-info">
                        <div className="clip-title">Segment {idx + 1}</div>
                        <a href={url} download={`segment-${idx + 1}.mp4`} className="clip-download">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
                {segmentFolder && segments.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <a
                      href={`https://simpleclips.onrender.com/api/download-all/${segmentFolder}`}
                      className="download-zip-btn"
                    >
                      Download All as ZIP
                    </a>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </main>
      )}
      {page === 'myvideos' && (
        <main className="main-content main-centered">
          <section className="recent-clips">
            <h3>Trimmed Video Clips</h3>
            <div className="clips-grid">
              {segments.length === 0 && <div className="no-clips">No segments yet. Upload and trim a video from Dashboard.</div>}
              {segments.map((url, idx) => (
                <div className="clip-card" key={idx}>
                  <div className="clip-thumb">
                    <video src={url} width={200} height={110} controls />
                  </div>
                  <div className="clip-info">
                    <div className="clip-title">Segment {idx + 1}</div>
                    <a href={url} download={`segment-${idx + 1}.mp4`} className="clip-download">Download</a>
                  </div>
                </div>
              ))}
            </div>
            {segmentFolder && segments.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <a
                  href={`https://simpleclips.onrender.com/api/download-all/${segmentFolder}`}
                  className="download-zip-btn"
                >
                  Download All as ZIP
                </a>
              </div>
            )}
          </section>
        </main>
      )}
      <footer className="site-footer">
        <div className="footer-content">
          <span>© {new Date().getFullYear()} Simpleclips &mdash; Made by Aaradhy Mahajan</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
