import React, {Component} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';

import Entity from 'src/components/EntityScreen/Entity';
import EntityInfoTags from 'src/components/EntityScreen/EntityInfoTags';
import DualPane from 'src/components/common/DualPane';
import DocumentMetadata from 'src/components/DocumentScreen/DocumentMetadata';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';

import './DocumentInfo.css';

class DocumentInfo extends Component {
    render() {
        const {document} = this.props;

        return (
          <DualPane.InfoPane className="DocumentInfo">
            <h1>
              <Entity.Label entity={document} addClass={true}/>
            </h1>
            <DocumentMetadata document={document}/>
            <h2>
              <FormattedMessage id="collection.section" defaultMessage="Origin"/>
            </h2>
            <div>
              <CollectionCard collection={document.collection}/>
            </div>
            <EntityInfoTags entity={document} />
          </DualPane.InfoPane>
        );
    }
}

const mapStateToProps = state => ({
  session: state.session,
});

export default connect(mapStateToProps)(DocumentInfo);
