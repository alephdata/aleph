import React, { Component } from 'react';
import { connect } from 'react-redux';

import { fetchDocument } from 'src/actions';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import Entity from 'src/components/EntityScreen/Entity';
import DocumentInfo from './DocumentInfo';
import DocumentContent from './DocumentContent';

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
    if (document === undefined) {
      return null;
    }
    return (
      <Screen>
        <Breadcrumbs collection={document.collection}>
          { document.parent && (
            <li>
              <Entity.Link entity={document.parent} className="pt-breadcrumb" icon short />
            </li>  
          )}
          <li>
            <a className="pt-breadcrumb pt-breadcrumb-current">
              <Entity.Label entity={document} icon short />
            </a>
          </li>
        </Breadcrumbs>
        <DualPane>
          <DocumentInfo document={document} />
          <DocumentContent document={document} />
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
}

export default connect(mapStateToProps, { fetchDocument })(DocumentScreen);
