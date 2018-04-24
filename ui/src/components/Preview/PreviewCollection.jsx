import React from 'react';
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import { CollectionInfo } from 'src/components/Collection';
import { SectionLoading, ErrorSection } from 'src/components/common';

class PreviewCollection extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (this.props.previewId !== prevProps.previewId) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded(props) {
    const { collection, previewId } = this.props;
    if (collection.id === undefined && !collection.isLoading && !collection.error) {
      this.props.fetchCollection({ id: previewId });
    }
  }

  render() {
    const { collection } = this.props;
    if (collection.error !== undefined) {
      return <ErrorSection title={collection.error} />
    }
    if (collection.id === undefined) {
      return <SectionLoading/>;
    }
    return <CollectionInfo collection={collection} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { collection: selectCollection(state, ownProps.previewId) };
};

PreviewCollection = connect(mapStateToProps, { fetchCollection }, null, { pure: false })(PreviewCollection);
export default PreviewCollection;