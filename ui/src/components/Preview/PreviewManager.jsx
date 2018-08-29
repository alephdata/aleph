import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import Preview from 'src/components/Preview/Preview';
import { PreviewEntity, PreviewCollection, PreviewDocument } from 'src/components/Preview/';


class PreviewManager extends React.Component {
  render() {
    const { previewId, previewType, previewMode, parsedHash } = this.props;
    if (previewId === undefined || previewId === null) {
      return <Preview hidden={true} />;
    }

    if (previewType === 'entity') {
      return <PreviewEntity previewId={previewId} previewMode={previewMode} parsedHash={parsedHash} />;
    }
    if (previewType === 'collection') {
      return <PreviewCollection previewId={previewId} previewMode={previewMode} parsedHash={parsedHash} />;
    }
    if (previewType === 'document') {
      return <PreviewDocument previewId={previewId} previewMode={previewMode} parsedHash={parsedHash} />;
    }
    return <Preview hidden={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const parsedHash = queryString.parse(ownProps.location.hash);
  return {
    previewId: parsedHash['preview:id'],
    previewType: parsedHash['preview:type'],
    previewMode: parsedHash['preview:mode'],
    parsedHash: parsedHash
  };
};

PreviewManager = connect(mapStateToProps, {}, null, { pure: false })(PreviewManager);
PreviewManager = withRouter(PreviewManager);
export default PreviewManager;