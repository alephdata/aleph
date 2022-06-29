{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

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
