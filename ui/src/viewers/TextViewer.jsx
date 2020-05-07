import React from 'react';
import { Pre } from '@blueprintjs/core';

import { Skeleton } from 'src/components/common';

import './TextViewer.scss';

class TextViewer extends React.Component {
  render() {
    const { document, noStyle } = this.props;
    const text = document.isPending
      ? <Skeleton.Text type="pre" length={4000} />
      : <Pre>{document.text}</Pre>;
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
