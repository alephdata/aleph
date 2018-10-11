import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { selectEntity, selectDocumentView } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewMode from 'src/components/Document/DocumentViewMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import DocumentViewsMenu from "../ViewsMenu/DocumentViewsMenu";
import { DocumentMetadata } from 'src/components/Document';
import { selectEntityTags } from "../../selectors";


class PreviewDocument extends React.Component {
  render() {
    const { previewId } = this.props;
    return (
      <DocumentContextLoader documentId={previewId}>
        {this.renderContext()}
      </DocumentContextLoader>
    );
  }

  renderContext() {
    const { document, previewMode, tags } = this.props;
    let mode = null, maximised = true;
    if (document.isError) {
      mode = <ErrorSection error={document.error} />
    } else if (document.id === undefined) {
      mode = <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode =
        <div className="pane-content">
          <DocumentMetadata document={document}/>
        </div>;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={document} />;
      maximised = true;
    } else {
      mode = <DocumentViewMode document={document}
                               activeMode={previewMode} />;
      maximised = true;
    }
    return (
      <Preview maximised={maximised}>
        {/*<DocumentViewsMenu document={document}
                          activeMode={previewMode}
                          isPreview={true} />*/}
        <DualPane.InfoPane className="with-heading">
          <DocumentToolbar document={document}
                            isPreview={true} />
          <DocumentInfoMode document={document} />
          <DocumentViewsMenu document={document}
                             activeMode={previewMode}
                             isPreview={true}
                             tags={tags}/>
        </DualPane.InfoPane>
      </Preview>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  return {
    document: selectEntity(state, previewId),
    previewMode: selectDocumentView(state, previewId, previewMode),
    tags: selectEntityTags(state, document.id)
  };
};

PreviewDocument = connect(mapStateToProps, {})(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;