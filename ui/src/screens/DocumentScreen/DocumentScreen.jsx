import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import { fetchDocument } from 'src/actions';
import { Screen, Entity, Breadcrumbs, ScreenLoading, DualPane } from 'src/components/common';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

import { DocumentContent, DocumentInfo } from '../../components/Document';

const messages = defineMessages({
  not_found: {
    id: 'document.not_found',
    defaultMessage: 'Document not found',
  },
  not_authorized: {
    id: 'collection.not_auth',
    defaultMessage: 'You are not authorized to do this.',
  },
  not_authorized_decr: {
    id: 'collection.not_auth_decr',
    defaultMessage: 'Please go to the login page.',
  }
});

class DocumentScreen extends Component {
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
    const { document, location } = this.props;
    if (document === undefined || document.isFetching) {
      return <ScreenLoading />;
    }

    console.log('document', document)

    if (document.status === 403) {
      return (
         <ErrorScreen.PageNotFound visual="error" title={messages.not_authorized}
                                      description={messages.not_authorized_decr}/>
        );
    } else if (document.error) {
      return (
        <ErrorScreen.PageNotFound visual="error" title={messages.not_found}/>
      );
    }

    const breadcrumbs = (<Breadcrumbs collection={document.collection}>
      { document.parent && (
        <li>
          <Entity.Link entity={document.parent} className="pt-breadcrumb" icon truncate={30} />
        </li>
      )}
      <li>
        <Entity.Link entity={document} className="pt-breadcrumb" icon truncate={30} />
      </li>
    </Breadcrumbs>);

    return (
      <Screen breadcrumbs={breadcrumbs} title={document.title || document.file_name}>
        <DualPane>
          <DocumentContent document={document} fragId={location.hash} />
          <DocumentInfo document={document} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  const document = documentId !== undefined
    ? state.entities[documentId]
    : undefined;
  return { documentId, document };
};

DocumentScreen = connect(mapStateToProps, { fetchDocument }, null, { pure: false })(DocumentScreen);
DocumentScreen = injectIntl(DocumentScreen);

export default DocumentScreen

