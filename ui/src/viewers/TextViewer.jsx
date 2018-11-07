import React from 'react';
import { connect } from 'react-redux';
import { Pre } from '@blueprintjs/core';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './TextViewer.scss';

class TextViewer extends React.Component {
  render() {
    const { content } = this.props;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }
    return (
      <React.Fragment>
        <div className="outer">
          <div className="inner TextViewer">
            <Pre>{content.text}</Pre>
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
