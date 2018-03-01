import React from 'react';

import { DocumentToolbar } from 'src/components/Toolbar';

import './TextViewer.css';

class TextViewer extends React.Component {
  render() {
    const { document } = this.props;
    return (
      <React.Fragment>
        <DocumentToolbar document={document}/>
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
