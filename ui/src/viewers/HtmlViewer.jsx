import { Component } from 'react';

import { Skeleton, SafeHtmlDocument } from 'components/common';

import './HtmlViewer.scss';

export default class HtmlViewer extends Component {
  render() {
    const { document, dir } = this.props;
    return (
      <div className="outer">
        <div className="inner HtmlViewer" dir={dir}>
          {
            document.isPending 
              ? <Skeleton.Text type="p" length={4000} />
              : <SafeHtmlDocument document={document} />
          }
        </div>
      </div>
    );
  }
}

