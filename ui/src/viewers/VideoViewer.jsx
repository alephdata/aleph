{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';

const VideoViewer = ({ document }) => {
  const src = document?.links?.file;

  if (!src) {
    return null;
  }

  return (
    <div className="outer">
      <div className="inner VideoViewer">
        <video controls width="100%" src={src} />
      </div>
    </div>
  );
}

export default VideoViewer;
