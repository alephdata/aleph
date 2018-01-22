import React, { PureComponent } from 'react';

import './HtmlViewer.css';

class HtmlViewer extends PureComponent {
  render() {
    const { html } = this.props;

    return (
      <div className="HtmlViewer">
        <span dangerouslySetInnerHTML={{__html: html}} />
      </div>
    );
  }
}

export default HtmlViewer;
