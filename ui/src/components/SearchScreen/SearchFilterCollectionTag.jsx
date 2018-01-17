import React, { PureComponent } from 'react';
import { Tag } from '@blueprintjs/core';
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
    const { collection, collectionId, removeCollection } = this.props;
    return (
      <Tag
        className="pt-large"
        onRemove={() => removeCollection(collectionId)}
      >
        {(collection === undefined || collection.isFetching)
          ? <code>{collectionId}</code>
          : <Collection.Label collection={collection} />
        }
      </Tag>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  collection: state.collections[ownProps.collectionId],
});

export default connect(mapStateToProps, { fetchCollection })(SearchFilterCollectionTag);