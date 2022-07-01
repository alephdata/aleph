import React from 'react';

import './ImageViewer.scss';

function ImageViewer(props) {
  const { document } = props;
  return (
    <div className="outer">
      <div className="inner ImageViewer">
        <img src={document?.links?.file} alt={document.getCaption()} />
      </div>
    </div>
  );
}

export default ImageViewer;
