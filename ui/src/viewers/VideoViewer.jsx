// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
