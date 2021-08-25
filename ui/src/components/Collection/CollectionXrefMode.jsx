import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, Intent } from '@blueprintjs/core';
import queryString from 'query-string';

import { getGroupField } from 'components/SearchField/util';
import SearchActionBar from 'components/common/SearchActionBar';
import Facets from 'components/Facet/Facets';
import { QueryInfiniteLoad } from 'components/common';
import CollectionXrefManageMenu from 'components/Collection/CollectionXrefManageMenu';
import XrefTable from 'components/XrefTable/XrefTable';
import SortingBar from 'components/SortingBar/SortingBar';
import { collectionXrefFacetsQuery } from 'queries';
import { selectCollection, selectCollectionXrefResult, selectTester } from 'selectors';
import { queryCollectionXref, queryRoles, triggerCollectionXrefDownload } from 'actions';

import './CollectionXrefMode.scss';

const messages = defineMessages({
  sort_random: {
    id: 'xref.sort.random',
    defaultMessage: 'Random',
  },
  sort_default: {
    id: 'xref.sort.default',
    defaultMessage: 'Default',
  },
  sort_label: {
    id: "xref.sort.label",
    defaultMessage: "Sort by:"
  }
});

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.toggleSort = this.toggleSort.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedId = undefined;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  toggleSort() {
    const { isRandomSort, query } = this.props;
    if (isRandomSort) {
      this.updateQuery(query.clear('sort'));
    } else {
      this.updateQuery(query.sortBy('random', 'desc'));
    }
  }

  render() {
    const { collection, isRandomSort, intl, isTester, query, result } = this.props;

    const exportLink = collection?.links?.xref_export;

    return (
      <section className="CollectionXrefMode">

        <div className="pane-layout">
          <div className="pane-layout-side">
            <Facets
              facets={['match_collection_id', 'schema', 'countries'].map(getGroupField)}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </div>
          <div className="pane-layout-main">
            <div className="CollectionXrefMode__actions">
              <CollectionXrefManageMenu
                collection={collection}
                result={result}
                query={query}
              />
              <SearchActionBar
                result={result}
                exportDisabled={!exportLink}
                onExport={() => this.props.triggerCollectionXrefDownload(collection.id)}
              >
                {isTester && (
                  <SortingBar
                    filterButtonLabel={intl.formatMessage(messages.sort_label)}
                    filterButton={
                      <Button
                        text={intl.formatMessage(messages[isRandomSort ? 'sort_random' : 'sort_default'])}
                        onClick={this.toggleSort}
                        minimal
                        intent={Intent.PRIMARY}
                      />
                    }
                  />
                )}
              </SearchActionBar>
            </div>
            <XrefTable result={result} />
            <QueryInfiniteLoad
              query={query}
              result={result}
              fetch={this.props.queryCollectionXref}
            />
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const query = collectionXrefFacetsQuery(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    query,
    isTester: selectTester(state),
    isRandomSort: query.getSort()?.field === 'random',
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles, triggerCollectionXrefDownload }),
  injectIntl,
)(CollectionXrefMode);
