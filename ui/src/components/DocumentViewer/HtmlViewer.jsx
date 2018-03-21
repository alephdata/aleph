import React, { Component } from 'react';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { document } = this.props;

    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner HtmlViewer">
            <span dangerouslySetInnerHTML={{__html: document.html}} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default HtmlViewer;
