import React from 'react';

import './TextViewer.css';

class TextViewer extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner TextViewer">
            <pre>{document.text}</pre>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default TextViewer;
