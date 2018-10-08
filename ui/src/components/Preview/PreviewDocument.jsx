import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { selectEntity } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import DocumentViewsMenu from "../ViewsMenu/DocumentViewsMenu";
import { selectEntitiesResult, selectEntityTags } from "../../selectors";
import { queryEntitySimilar } from "../../queries";


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
    const { document, previewMode = 'view', similar, tags } = this.props;
    let mode = null, maximised = false;
    if (document.isError) {
      mode = <ErrorSection error={document.error} />
    } else if (document.id === undefined) {
      mode = <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode = <DocumentInfoMode document={document} />;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={document} />;
      maximised = true;
    } else if (previewMode === 'similar') {
      mode = <EntitySimilarMode entity={document} />;
      maximised = true;
    } else {
      mode = <DocumentViewer document={document} showToolbar={true} previewMode={true} />;
      maximised = true;
    }
    return (
      <Preview maximised={maximised}>
        <DocumentViewsMenu document={document}
                          activeMode={previewMode}
                          isPreview={true}
                          similar={similar} tags={tags}/>
        <DualPane.InfoPane className="with-heading">
          <DocumentToolbar document={document}
                            isPreview={true} />
          {mode}
        </DualPane.InfoPane>
      </Preview>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { previewId, location } = ownProps;
  return {
    document: selectEntity(state, previewId),
    tags: selectEntityTags(state, previewId),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, previewId))
  };
};

PreviewDocument = connect(mapStateToProps, {})(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;