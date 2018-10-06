import React, { Component } from 'react';
import { connect } from 'react-redux';

import { selectDocumentContent } from 'src/selectors';

import './HtmlViewer.css';

class HtmlViewer extends Component {
  render() {
    const { content } = this.props;

    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner HtmlViewer">
            <span dangerouslySetInnerHTML={{__html: content.html}} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    content: selectDocumentContent(state, document.id)
  };
}

HtmlViewer = connect(mapStateToProps)(HtmlViewer);
export default HtmlViewer;
