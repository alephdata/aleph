import React, { Component } from 'react';

import { DocumentToolbar } from 'src/components/Toolbar';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { document } = this.props;

    return (
      <React.Fragment>
        <DocumentToolbar document={document}/>
        <div className="ContentPaneOuter">
          <div className="ContentPaneInner HtmlViewer">
            <span dangerouslySetInnerHTML={{__html: document.html}} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default HtmlViewer;
