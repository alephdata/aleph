import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import CollectionToolbar from 'src/components/Collection/CollectionToolbar';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import DocumentInfo from 'src/components/Document/DocumentInfo';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane } from 'src/components/common';
import { fetchDocument } from 'src/actions';
import { selectEntity } from "src/selectors";


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
    const { documentId, document } = this.props;
    if (document.shouldLoad) {
      this.props.fetchDocument({id: documentId});
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

    return (
      <Screen title={document.name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <DocumentViewsMenu document={document}
                               activeMode={activeMode}
                               isPreview={false}/>
            <div>
              {this.props.children}
            </div>
          </DualPane.ContentPane>
          <DualPane.InfoPane className="with-heading">
            <DocumentInfo document={document} isPreview={false} />
          </DualPane.InfoPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps;
  return {
    document: selectEntity(state, documentId)
  };
};

DocumentScreenContext = withRouter(DocumentScreenContext);
DocumentScreenContext = connect(mapStateToProps, { fetchDocument })(DocumentScreenContext);
export default (DocumentScreenContext);
