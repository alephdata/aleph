import React, { Component } from 'react';

import { Skeleton } from 'components/common';

import './HtmlViewer.scss';

class HtmlViewer extends Component {
  render() {
    const { document } = this.props;
    const body = document.isPending
      ? <Skeleton.Text type="p" length={4000} />
      : <span dangerouslySetInnerHTML={{ __html: document.safeHtml }} />;
    return (
      <div className="outer">
        <div className="inner HtmlViewer">
          {body}
        </div>
      </div>
    );
  }
}

export default HtmlViewer;
