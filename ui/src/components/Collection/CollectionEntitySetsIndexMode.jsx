// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { queryEntitySets } from 'actions';
import { collectionEntitySetsQuery } from 'queries';
import { selectCollection, selectEntitySetsResult } from 'selectors';
import { ErrorSection } from 'components/common';
import EntitySetCreateMenu from 'components/EntitySet/EntitySetCreateMenu';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';

export class CollectionEntitySetsIndexMode extends Component {
  render() {
    const { collection, query, result, type } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    return (
      <div>
        {collection.writeable && (
          <div style={{ marginBottom: '20px' }}>
            <EntitySetCreateMenu collection={collection} type={type} />
          </div>
        )}
        <EntitySetIndex
          query={query}
          result={result}
          showCollection={false}
          type={type}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location, type } = ownProps;
  const query = collectionEntitySetsQuery(location, collectionId).setFilter('type', type);
  return {
    collection: selectCollection(state, collectionId),
    query,
    result: selectEntitySetsResult(state, query),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets }),
)(CollectionEntitySetsIndexMode);
