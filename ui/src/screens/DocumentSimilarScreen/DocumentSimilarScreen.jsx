import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Entity, Breadcrumbs, DualPane } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import { DocumentInfo } from 'src/components/Document';
import DocumentViewsMenu from "src/components/ViewsMenu/DocumentViewsMenu";

class DocumentSimilarScreen extends Component {
  componentDidMount() {
    const { documentId } = this.props;
    this.props.fetchDocument({ id: documentId });
  }

  componentDidUpdate(prevProps) {
    const { documentId } = this.props;
    if (documentId !== prevProps.documentId) {
      this.props.fetchDocument({ id: documentId });
    }
  }

  render() {
    const { document, query } = this.props;
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
      <Screen breadcrumbs={breadcrumbs} title={document.title || document.file_name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <DocumentViewsMenu document={document} isPreview={false} isActive='similar'/>
            <EntitySimilarMode entity={document}
                               query={query} />
          </DualPane.ContentPane>
          <DocumentInfo document={document} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  const path = documentId ? `entities/${documentId}/similar` : undefined;
  const query = Query.fromLocation(path, {}, {}, 'similar').limit(75);

  return {
    documentId,
    document: selectEntity(state, documentId),
    query: query
  };
};

DocumentSimilarScreen = connect(mapStateToProps, { fetchDocument }, null, { pure: false })(DocumentSimilarScreen);
DocumentSimilarScreen = injectIntl(DocumentSimilarScreen);
export default DocumentSimilarScreen
