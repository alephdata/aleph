import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import Collection from 'src/components/common/Collection';

class SearchFilterCollectionTag extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;
    if (collection === undefined) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const { collection, collectionId } = this.props;
    if (collection === undefined || collection.isFetching) {
      return (
        <code>{collectionId}</code>
      );
    } else {
     return (
       <Collection.Label collection={collection} />
     );
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  collection: state.collections[ownProps.collectionId],
});

export default connect(mapStateToProps, { fetchCollection })(SearchFilterCollectionTag);
