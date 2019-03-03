import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import Preview from 'src/components/Preview/Preview';
import { PreviewEntity, PreviewCollection, PreviewDocument } from 'src/components/Preview/';

function PreviewManager(props) {
  const {
    previewId, previewType, previewMode, parsedHash,
  } = props;
  if (previewId === undefined || previewId === null) {
    return <Preview hidden />;
  }

  if (previewType === 'entity') {
    return (
      <PreviewEntity
        previewId={previewId}
        previewMode={previewMode}
        parsedHash={parsedHash}
      />
    );
  }
  if (previewType === 'collection') {
    return (
      <PreviewCollection
        previewId={previewId}
        previewMode={previewMode}
        parsedHash={parsedHash}
      />
    );
  }
  if (previewType === 'document') {
    return (
      <PreviewDocument
        previewId={previewId}
        previewMode={previewMode}
        parsedHash={parsedHash}
      />
    );
  }
  return <Preview hidden />;
}

const mapStateToProps = (state, ownProps) => {
  const parsedHash = queryString.parse(ownProps.location.hash);
  return {
    previewId: parsedHash['preview:id'],
    previewType: parsedHash['preview:type'],
    previewMode: parsedHash['preview:mode'],
    parsedHash,
  };
};

const PreviewManagerConnected = connect(mapStateToProps, {}, null, { pure: false })(PreviewManager);
const PreviewManagerWithRouter = withRouter(PreviewManagerConnected);
export default PreviewManagerWithRouter;
