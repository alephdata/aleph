import React, { Component } from 'react';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { html } = this.props;
    return (
      <div className="HtmlViewer">
        <iframe sandbox srcDoc={html}></iframe>
      </div>
    );
  }
}

export default HtmlViewer;
