import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Preview from 'src/components/Preview/Preview';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import DocumentViews from 'src/components/Document/DocumentViews';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectDocumentView } from 'src/selectors';
/* eslint-disable */


class PreviewDocument extends React.Component {
  render() {
    const { previewId } = this.props;
    return (
      <EntityContextLoader entityId={previewId}>
        <Preview maximised>
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Preview>
      </EntityContextLoader>
    );
  }

  renderContext() {
    const { document, previewMode } = this.props;
    if (document.isError) {
      return <ErrorSection error={document.error} />;
    }
    if (document.shouldLoad || document.isLoading) {
      return <SectionLoading />;
    }

    return (
      <React.Fragment>
        <EntityToolbar entity={document} isPreview />
        <EntityHeading entity={document} />
        <DocumentViews
          document={document}
          activeMode={previewMode}
          isPreview
        />
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  return {
    document: selectEntity(state, previewId),
    previewMode: selectDocumentView(state, previewId, previewMode),
  };
};

PreviewDocument = connect(mapStateToProps, {})(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;
