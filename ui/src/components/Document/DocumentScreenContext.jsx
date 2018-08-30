import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs, Entity } from 'src/components/common';
import { fetchDocument, fetchEntityTags } from 'src/actions';
import { selectEntity, selectEntityTags } from "src/selectors";


class DocumentScreenContext extends Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  // componentDidMount() {
  //   const { documentId } = this.props;
  //   this.props.fetchDocument({ id: documentId });
  // }

  // componentDidUpdate(prevProps) {
  //   const { documentId } = this.props;
  //   if (documentId !== prevProps.documentId) {
  //     this.props.fetchDocument({ id: documentId });
  //   }
  // }

  fetchIfNeeded() {
    const { documentId, document, tags } = this.props;
    if (document.shouldLoad) {
      this.props.fetchDocument({id: documentId});
    }
    if (document.id !== undefined && tags.shouldLoad) {
      this.props.fetchEntityTags(document);
    }
  }

  render() {
    const { document, activeMode } = this.props;
    if (document.isError) {
      return <ErrorScreen error={document.error} />;
    }
    if (document === undefined || document.id === undefined) {
      return <LoadingScreen />;
    }

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
      </Breadcrumbs>
    );

    return (
      <Screen title={document.name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <DocumentViewsMenu document={document}
                               activeMode={activeMode}
                               isPreview={false}/>
            <div>
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
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps;
  return {
    document: selectEntity(state, documentId),
    tags: selectEntityTags(state, documentId)
  };
};

DocumentScreenContext = withRouter(DocumentScreenContext);
DocumentScreenContext = connect(mapStateToProps, { fetchDocument, fetchEntityTags })(DocumentScreenContext);
export default (DocumentScreenContext);
