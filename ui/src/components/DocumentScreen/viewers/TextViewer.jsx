import React from 'react';

import Toolbar from 'src/components/common/Toolbar/DocumentToolbar';

import './TextViewer.css';

class TextViewer extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <React.Fragment>
        <Toolbar document={document}/>
        <div className="ContentPaneOuter">
          <div className="ContentPaneInner TextViewer">
            <pre>{document.text}</pre>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default TextViewer;
