import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Screen, Entity, Breadcrumbs, ScreenLoading, DualPane } from 'src/components/common';
import { DocumentContent, DocumentInfo } from '../../components/Document';
import ErrorScreen from "../../components/ErrorMessages/ErrorScreen";


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
    const { document } = this.props;
    if (document.isLoading) {
      return (<ScreenLoading />);
    }

    if (document.error) {
      return (<ErrorScreen.NoTranslation title={document.error}/>);
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
          <DocumentContent document={document} />
          <DocumentInfo document={document} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  return { documentId, document: selectEntity(state, documentId) };
};

DocumentScreen = connect(mapStateToProps, { fetchDocument }, null, { pure: false })(DocumentScreen);
DocumentScreen = injectIntl(DocumentScreen);
export default DocumentScreen
