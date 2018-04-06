import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import { fetchDocument } from 'src/actions';
import Screen from 'src/components/common/Screen';
import Entity from 'src/screens/EntityScreen/Entity';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import ScreenLoading from 'src/components/common/ScreenLoading';
import DualPane from 'src/components/common/DualPane';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

import DocumentInfo from './DocumentInfo';
import DocumentContent from './DocumentContent';

const messages = defineMessages({
  not_found: {
    id: 'document.not_found',
    defaultMessage: 'Document not found',
  },
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
    if (document.error) {
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

