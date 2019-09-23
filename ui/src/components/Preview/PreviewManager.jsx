import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import Preview from 'src/components/Preview/Preview';
import { PreviewEntity } from 'src/components/Preview/';

function PreviewManager(props) {
  const {
    previewId, previewMode, parsedHash,
  } = props;
  if (previewId === undefined || previewId === null) {
    return <Preview hidden />;
  }

  console.log('rendering preview manager');

  return (
    <PreviewEntity
      previewId={previewId}
      previewMode={previewMode}
      parsedHash={parsedHash}
    />
  );
}

const mapStateToProps = (state, ownProps) => {
  const parsedHash = queryString.parse(ownProps.location.hash);
  return {
    previewId: parsedHash['preview:id'],
    previewMode: parsedHash['preview:mode'],
    parsedHash,
  };
};

const PreviewManagerConnected = connect(mapStateToProps, {}, null, { pure: false })(PreviewManager);
const PreviewManagerWithRouter = withRouter(PreviewManagerConnected);
export default PreviewManagerWithRouter;
