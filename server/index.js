// Simple Express server for video upload and segmentation
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const archiver = require('archiver');

const app = express();
const PORT = 5000;

// Set your ffmpeg path here if not in PATH
defaultFFmpegPath = 'ffmpeg'; // Change if needed

// Storage for uploaded videos
const upload = multer({ dest: 'uploads/' });

// Ensure output directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

app.use(cors());
app.use('/segments', express.static(path.join(__dirname, 'segments')));

// Upload and segment endpoint
app.post('/api/upload', upload.single('video'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  // Get segment time from form data (default 60)
  let segmentTime = 60;
  if (req.body && req.body.segmentTime) {
    const parsed = parseInt(req.body.segmentTime, 10);
    if (!isNaN(parsed) && parsed > 0) segmentTime = parsed;
  }

  const segmentDir = path.join(__dirname, 'segments', file.filename);
  ensureDir(segmentDir);
  const segmentPattern = path.join(segmentDir, 'out%03d.mp4');

  // ffmpeg command to split video into user-selected segments
  const ffmpegCmd = `${defaultFFmpegPath} -i "${file.path}" -c copy -map 0 -segment_time ${segmentTime} -f segment -reset_timestamps 1 "${segmentPattern}"`;

  exec(ffmpegCmd, (err) => {
    if (err) {
      return res.status(500).json({ error: 'ffmpeg failed', details: err.message });
    }
    // List generated segments
    fs.readdir(segmentDir, (err, files) => {
      if (err) return res.status(500).json({ error: 'Failed to list segments' });
      const urls = files.map(f => `/segments/${file.filename}/${f}`);
      res.json({ segments: urls });
    });
  });
});

// Download all segments as zip
app.get('/api/download-all/:folder', (req, res) => {
  const folder = req.params.folder;
  const segmentDir = path.join(__dirname, 'segments', folder);
  if (!fs.existsSync(segmentDir)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="segments-${folder}.zip"`);
  const archive = archiver('zip');
  archive.pipe(res);
  archive.directory(segmentDir, false);
  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
