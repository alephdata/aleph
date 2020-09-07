import React from 'react';

const AudioViewer = ({ document }) => {
  const src = document?.links?.file;

  if (!src) {
    return null;
  }

  return (
    <div className="AudioViewer">
      <audio
        controls
        style={{ width: '100%' }}
        src={src}
      />
    </div>
  );
}

export default AudioViewer;
