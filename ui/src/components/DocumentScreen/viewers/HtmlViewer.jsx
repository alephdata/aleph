import React, { Component } from 'react';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { html } = this.props;
    // <iframe sandbox srcDoc={html}></iframe>
    return (
      <div className="HtmlViewer">
        <span dangerouslySetInnerHTML={{__html: html}} />
      </div>
    );
  }
}

export default HtmlViewer;
