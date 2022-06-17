// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
