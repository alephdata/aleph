import React, { Component } from 'react';

import Toolbar from 'src/components/common/Toolbar/DocumentToolbar';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { document } = this.props;

    return (
      <React.Fragment>
        <Toolbar document={document}/>
        <div className="content-pane-outer">
          <div className="content-pane-inner HtmlViewer">
            <span dangerouslySetInnerHTML={{__html: document.html}} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default HtmlViewer;
