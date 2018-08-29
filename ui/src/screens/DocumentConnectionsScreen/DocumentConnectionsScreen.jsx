import React, {Component} from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { selectEntity } from 'src/selectors';
import { Breadcrumbs, DualPane, Entity } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import EntityInfoTags from "src/components/Entity/EntityInfoTags";
import { DocumentInfo } from 'src/components/Document/';
import DocumentViewsMenu from "src/components/ViewsMenu/DocumentViewsMenu";
import { fetchDocument } from "src/actions";

import './DocumentConnectionsScreen.css';

class DocumentConnectionsScreen extends Component {
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
    const { document: doc } = this.props;
    if (doc.isError) {
      return <ErrorScreen error={doc.error}/>;
    }
    if (doc === undefined || doc.id === undefined) {
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
      <Screen breadcrumbs={breadcrumbs} title={doc.title || doc.file_name}>
        <DualPane>
          <DualPane.ContentPane className='DocumentConnectionsScreen'>
            <DocumentViewsMenu document={doc} isPreview={false} isActive='connections'/>
            <EntityInfoTags entity={doc} />
          </DualPane.ContentPane>
          <DocumentInfo document={doc} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  return {
    documentId,
    document: selectEntity(state, documentId),
  };
};

DocumentConnectionsScreen = connect(mapStateToProps, { fetchDocument }, null, { pure: false })(DocumentConnectionsScreen);
DocumentConnectionsScreen = injectIntl(DocumentConnectionsScreen);
export default DocumentConnectionsScreen;
