import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchCollection, fetchCollectionXrefIndex } from 'src/actions';
import { selectCollection, selectCollectionXrefIndex } from 'src/selectors';
import CollectionToolbar from 'src/components/Collection/CollectionToolbar';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import Preview from 'src/components/Preview/Preview';
import CollectionViewsMenu from "../ViewsMenu/CollectionViewsMenu";

class PreviewCollection extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded(props) {
    const { collection, previewId } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: previewId });
    }

    // we're loading this here so it's available both to the xrefindex screen
    // and to the view selection menu.
    const { xrefIndex } = this.props;
    if (xrefIndex.shouldLoad) {
      this.props.fetchCollectionXrefIndex({id: previewId});
    }
  }

  render() {
    const { collection, previewMode = 'info' } = this.props;
    let mode = null, maximised = false;
    if (collection.isError) {
      mode = <ErrorSection error={collection.error} />
    } else if (collection.id === undefined) {
      mode = <SectionLoading/>;
    } else if (previewMode === 'xref') {
      mode = <CollectionXrefIndexMode collection={collection} />;
      maximised = true;
    } else if (previewMode === 'documents') {
      mode = <CollectionDocumentsMode collection={collection} />;
      maximised = true;
    } else {
      mode = <CollectionInfoMode collection={collection} />;
    }
    return (
      <Preview maximised={maximised}>
        <CollectionViewsMenu collection={collection}
                             activeMode={previewMode}
                             isPreview={true} />
        <DualPane.InfoPane className="with-heading">
          <CollectionToolbar collection={collection}
                             isPreview={true} />
          {mode}
        </DualPane.InfoPane>
      </Preview>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    collection: selectCollection(state, ownProps.previewId),
    xrefIndex: selectCollectionXrefIndex(state, ownProps.previewId)
  };
};

PreviewCollection = connect(mapStateToProps, { fetchCollection, fetchCollectionXrefIndex })(PreviewCollection);
PreviewCollection = withRouter(PreviewCollection);
export default PreviewCollection;