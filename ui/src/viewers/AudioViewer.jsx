import React from 'react';

import './AudioViewer.scss';

const AudioViewer = ({ document }) => {
  const src = document?.links?.file;

  if (!src) {
    return null;
  }

  return (
    <div className="AudioViewer">
      <audio controls src={src} />
    </div>
  );
};

export default AudioViewer;
