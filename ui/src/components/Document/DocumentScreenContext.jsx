import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/Screen/Screen';
import DocumentContextLoader from 'src/components/Document/DocumentContextLoader';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs, Entity } from 'src/components/common';
import { selectEntity } from 'src/selectors';
import { selectEntitiesResult, selectEntityTags } from "../../selectors";
import { queryEntitySimilar } from "../../queries";
import { withRouter } from "react-router";

class DocumentScreenContext extends Component {
  render() {
    const { document, documentId, activeMode, subtitle, similar, tags } = this.props;
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

    const count = activeMode === 'similar' ? '(' + similar.total + ')' : activeMode === 'tags' ? '(' + tags.total + ')'  : '';

    const breadcrumbs = (
      <Breadcrumbs collection={document.collection}>
        { document.parent && (
          <li>
            <Entity.Link entity={document.parent} className="pt-breadcrumb" icon truncate={30} />
          </li>
        )}
        <li>
          <Entity.Link entity={document} className="pt-breadcrumb" icon truncate={30} />
        </li>
        <li>
          <span className='pt-breadcrumb'>
            {activeMode === 'view' ? 'Document' : activeMode === 'text' ? 'Extracted text' : subtitle + count}
          </span>
        </li>
      </Breadcrumbs>
    );

    return (
      <DocumentContextLoader documentId={documentId}>
        <Screen title={document.name}>
          <DualPane>
            <DualPane.ContentPane className='view-menu-flex-direction'>
              <DocumentViewsMenu document={document}
                                activeMode={activeMode}
                                isPreview={false} similar={similar} tags={tags}/>
              <div className='content-children'>
                {breadcrumbs}
                {this.props.children}
              </div>
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <DocumentToolbar document={document} isPreview={false} />
              <DocumentInfoMode document={document} isPreview={false} />
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </DocumentContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId, location } = ownProps;
  return {
    document: selectEntity(state, documentId),
    tags: selectEntityTags(state, documentId),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, documentId))
  };
};

DocumentScreenContext = connect(mapStateToProps, {})(DocumentScreenContext);
DocumentScreenContext = withRouter(DocumentScreenContext);
export default (DocumentScreenContext);
