import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import SectionLoading from 'src/components/common/SectionLoading';

import './ImageViewer.css';


class ImageViewer extends Component {
  render() {
    const { document, mode } = this.props;
    if (!document.links || !document.links.file) {
      return <SectionLoading />;
    }

    return (<div className="outer">
        <div className="inner ImageViewer">
          { mode === 'text' && (
            <pre>{document.text}</pre>
          )}
          { mode !== 'text' && (
            <img src={document.links.file} alt={document.file_name} />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const mode = hashQuery.mode || 'view';
  return { mode };
}

ImageViewer = connect(mapStateToProps)(ImageViewer);
ImageViewer = withRouter(ImageViewer);
export default ImageViewer