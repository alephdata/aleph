// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
}

export default AudioViewer;
