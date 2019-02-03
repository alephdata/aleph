import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Preview from 'src/components/Preview/Preview';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentHeading from 'src/components/Document/DocumentHeading';
import DocumentViews from "src/components/Document/DocumentViews";
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectDocumentView } from 'src/selectors';


class PreviewDocument extends React.Component {
  render() {  
    const { previewId } = this.props;
    return (
      <DocumentContextLoader documentId={previewId}>
        <Preview maximised={true}>
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Preview>
      </DocumentContextLoader>
    );
  }

  renderContext() {
    const { document, previewMode } = this.props;
    if (document.isError) {
      return <ErrorSection error={document.error} />
    }
    if (document.shouldLoad || document.isLoading) {
      return <SectionLoading/>;
    }

    return (
      <React.Fragment>
        <DocumentToolbar document={document}
                         isPreview={true} />
        <DocumentHeading document={document} />
        <DocumentViews document={document}
                       activeMode={previewMode}
                       isPreview={true} />
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  return {
    document: selectEntity(state, previewId),
    previewMode: selectDocumentView(state, previewId, previewMode)
  };
};

PreviewDocument = connect(mapStateToProps, {})(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;