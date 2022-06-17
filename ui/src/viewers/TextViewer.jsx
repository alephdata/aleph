// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { Pre } from '@blueprintjs/core';

import { Skeleton } from 'components/common';

import './TextViewer.scss';

class TextViewer extends PureComponent {
  render() {
    const { document, dir, noStyle } = this.props;
    const text = document.isPending
      ? <Skeleton.Text type="pre" length={4000} />
      : <Pre>{document.getFirst('bodyText')}</Pre>;
    return noStyle ? text : (
      <div className="outer">
        <div className="inner TextViewer" dir={dir}>
          {text}
        </div>
      </div>
    );
  }
}

export default TextViewer;
