import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import SectionLoading from 'src/components/common/SectionLoading';
import { selectDocumentContent } from 'src/selectors';

import './ImageViewer.css';


class ImageViewer extends Component {
  render() {
    const { document, content, activeMode } = this.props;
    if (content.shouldLoad || content.isLoading) {
      return <SectionLoading />;
    }
    return (
      <div className="outer">
        <div className="inner ImageViewer">
          { activeMode === 'text' && (
            <pre>{content.text}</pre>
          )}
          { activeMode !== 'text' && (
            <img src={document.links.file} alt={document.file_name} />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    content: selectDocumentContent(state, document.id)
  };
}

ImageViewer = connect(mapStateToProps)(ImageViewer);
ImageViewer = withRouter(ImageViewer);
export default ImageViewer