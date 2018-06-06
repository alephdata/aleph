import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { Screen, Breadcrumbs, SectionLoading } from 'src/components/common';
import { Toolbar, FolderButtons } from 'src/components/Toolbar';
import CaseContext from "src/components/Case/CaseContext";
import { fetchCollection, uploadDocument } from "src/actions";
import { selectCollection } from "src/selectors";
import EntitySearch from "src/components/EntitySearch/EntitySearch";

import './CaseDocumentsScreen.css';


class CaseDocumentsContent extends Component {
  async componentDidMount() {
    const {collectionId} = this.props;
    this.props.fetchCollection({id: collectionId});
  }

  componentDidUpdate(prevProps) {
    const {collectionId} = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({id: collectionId});
    }
  }

  render() {
    const { collection } = this.props;

    if (!collection.id) {
      return <SectionLoading />;
    }

    const context = {
      'filter:collection_id': collection.id
    };

    return (
      <Screen title={collection.label}
              breadcrumbs={<Breadcrumbs collection={collection}/>}
              className='CaseDocumentsScreen'>
        <CaseContext collection={collection} activeTab='Documents'>
          <Toolbar>
            <FolderButtons collection={collection} />
          </Toolbar>
          <EntitySearch context={context}
                        hideCollection={true}
                        documentMode={true} />
        </CaseContext>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId)
  };
};

CaseDocumentsContent = injectIntl(CaseDocumentsContent);
CaseDocumentsContent = connect(mapStateToProps, {fetchCollection, uploadDocument})(CaseDocumentsContent);
export default CaseDocumentsContent;
