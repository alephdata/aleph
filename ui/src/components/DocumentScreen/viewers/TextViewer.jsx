import React, { Component } from 'react';

import './TextViewer.css';

class TextViewer extends Component {
  render() {
    const { text } = this.props;
    return (
      <div className="TextViewer">
        <pre>{text}</pre>
      </div>
    );
  }
}

export default TextViewer;
