import React, { Component } from 'react';

import './HtmlViewer.css';

class HtmlViewer extends Component {
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
