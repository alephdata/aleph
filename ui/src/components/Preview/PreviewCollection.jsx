import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import CollectionInfo from 'src/components/Collection/CollectionInfo';
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import { SectionLoading, ErrorSection } from 'src/components/common';
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
  }

  render() {
    const { collection, previewMode } = this.props;
    let mode = null;
    if (collection.isError) {
      mode = <ErrorSection error={collection.error} />
    } else if (collection.id === undefined) {
      mode = <SectionLoading/>;
    } else if (previewMode === 'xref') {
      mode = <CollectionXrefIndexMode collection={collection} />;
    } else if (previewMode === 'documents') {
      mode = <CollectionDocumentsMode collection={collection} />;
    } else {
      mode = <CollectionInfo collection={collection} isPreview={true} />;
    }
    return (
      <Preview maximised={true}>
        <CollectionViewsMenu collection={collection}
                             activeMode={previewMode}
                             isPreview={true} />
        {mode}
      </Preview>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { collection: selectCollection(state, ownProps.previewId) };
};

PreviewCollection = connect(mapStateToProps, { fetchCollection })(PreviewCollection);
PreviewCollection = withRouter(PreviewCollection);
export default PreviewCollection;