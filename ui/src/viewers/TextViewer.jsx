import React from 'react';
import { Pre } from '@blueprintjs/core';

import { Skeleton } from 'components/common';

import './TextViewer.scss';

class TextViewer extends React.Component {
  render() {
    const { document, noStyle } = this.props;
    const bodyText = document.getFirst('bodyText');
    const text = document.isPending
      ? <Skeleton.Text type="pre" length={4000} />
      : <Pre>{bodyText}</Pre>;
    return noStyle ? text : (
      <div className="outer">
        <div className="inner TextViewer">
          {text}
        </div>
      </div>
    );
  }
}

export default TextViewer;
