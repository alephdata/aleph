import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/Screen/Screen';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentHeading from 'src/components/Document/DocumentHeading';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import { selectEntity } from 'src/selectors';
import { selectEntityTags } from "../../selectors";

class DocumentScreenContext extends Component {
  render() {
    const { document, documentId, activeMode, screenTitle, tags } = this.props;

    if (document.isError) {
      return <ErrorScreen error={document.error} />;
    }
    if (document.shouldLoad || document.isLoading) {
      return (
        <DocumentContextLoader documentId={documentId}>
          <LoadingScreen />
        </DocumentContextLoader>
      ); 
    }

    const breadcrumbs = (
      <Breadcrumbs>
        <Breadcrumbs.Collection collection={document.collection} />
        {document.parent && (
          <Breadcrumbs.Entity entity={document.parent} />
        )}
        <Breadcrumbs.Entity entity={document} />
        <Breadcrumbs.Text text={screenTitle} />
      </Breadcrumbs>
    );

    return (
      <DocumentContextLoader documentId={documentId}>
        <Screen title={screenTitle !== null ? `${screenTitle}: ${document.name}` : document.name}>
          {breadcrumbs}
          <DualPane>
            <DualPane.ContentPane className="view-menu-flex-direction">
              <DocumentViewsMenu document={document}
                                activeMode={activeMode}
                                isPreview={false}
                                tags={tags}/>
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <DocumentToolbar document={document} isPreview={false} />
              <DocumentHeading document={document} isPreview={false} />
              <div className="pane-content">
                <DocumentInfoMode document={document} isPreview={false} />
              </div>
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </DocumentContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps;
  const document = selectEntity(state, documentId);
  return {
    document,
    tags: selectEntityTags(state, document.id)
  };
};

DocumentScreenContext = connect(mapStateToProps, {})(DocumentScreenContext);
export default (DocumentScreenContext);
