import React, { PureComponent } from 'react';

import './TextViewer.css';

class TextViewer extends PureComponent {
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
