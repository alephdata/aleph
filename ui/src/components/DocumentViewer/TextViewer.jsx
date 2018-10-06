import React from 'react';
import { connect } from 'react-redux';

import { selectDocumentContent } from 'src/selectors';

import './TextViewer.css';

class TextViewer extends React.Component {
  render() {
    const { content } = this.props;
    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner TextViewer">
            <pre>{content.text}</pre>
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

TextViewer = connect(mapStateToProps)(TextViewer);
export default TextViewer;
