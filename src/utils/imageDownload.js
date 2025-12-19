export function downloadImage(imageData, score, iteration) {
  const link = document.createElement('a');
  link.href = imageData;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.download = `frame_${timestamp}_${score}pct_iter${iteration}.png`;
  link.click();
}

export function getScoreColor(score) {
  if (score >= 95) return '#00ff88';
  if (score >= 85) return '#ffaa00';
  if (score >= 70) return '#ff8800';
  return '#ff4444';
}

export function getScoreTier(score) {
  if (score >= 95) return 'Professional quality';
  if (score >= 85) return 'Good quality';
  if (score >= 70) return 'Acceptable';
  return 'Significant issues';
}
