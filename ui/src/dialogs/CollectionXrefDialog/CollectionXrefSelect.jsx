import React, { Component } from 'react';
import { Card, Button, Spinner } from '@blueprintjs/core';
import { FormattedMessage, injectIntl } from 'react-intl';
import Query from 'src/app/Query';
import CheckboxList from 'src/components/common/CheckboxList';
import { Waypoint } from 'react-waypoint';
import { queryEndpoint } from 'src/actions/util';
import { showWarningToast } from 'src/app/toast';

import CollectionXrefFilter from './CollectionXrefFilter';


const convertCollectionToItem = collection => ({
  id: collection.id,
  label: collection.label,
  count: collection.count,
});

class CollectionXrefSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryResult: null,
      showSelected: false,
    };
    this.listRef = React.createRef();
  }

  componentDidUpdate() {
    const { showSelected } = this.state;
    const { selectedCollections } = this.props;
    if (selectedCollections.length <= 0 && showSelected) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ showSelected: false });
    }
  }

  onFilterChange(filter) {
    const context = {
      facet: ['category'],
      'filter:kind': 'source',
    };
    const state = {
      'filter:category': filter.category ? filter.category.id : null,
      prefix: filter.searchTerm,
    };
    const query = new Query('collections', state, context, '')
      .sortBy('count', 'desc')
      .limit(40);

    this.setState({ query });
    this.fetchCollections(query);
  }

  onSelect(id) {
    const { queryResult, showSelected } = this.state;
    const { collectionSelectFn, selectedCollections } = this.props;

    const CollectionIndex = showSelected ? selectedCollections : queryResult.results;
    const matchingCollection = CollectionIndex.find(c => c.id === id);
    if (matchingCollection) {
      collectionSelectFn(matchingCollection);
    }
  }

  getMoreResults() {
    const { queryResult, loading, query } = this.state;
    if (!loading && queryResult && queryResult.next) {
      this.fetchCollections(query, queryResult.next);
    }
  }

  fetchCollections(query, next) {
    const { queryResult } = this.state;
    this.setState({ loading: true });
    queryEndpoint({ query, next })
      .then((response) => {
        if (next) {
          const updatedQueryResult = {
            ...queryResult,
            results: queryResult.results.concat(response.result.results),
            next: response.result.next,
          };
          this.setState({ queryResult: updatedQueryResult, loading: false });
        } else {
          this.setState({ queryResult: response.result, loading: false });
          this.listRef.current.scrollTop = 0;
        }
      })
      .catch((e) => {
        this.setState({ loading: false });
        showWarningToast(e.message);
      });
  }

  toggleShowSelected() {
    const { showSelected } = this.state;
    this.setState({ showSelected: !showSelected });
  }

  render() {
    const { queryResult, showSelected, loading } = this.state;
    const { selectedCollections } = this.props;

    const getCheckboxItems = () => {
      if (!queryResult) {
        return [];
      }
      return queryResult.results.map(convertCollectionToItem);
    };

    return (
      <Card>
        <CollectionXrefFilter
          categories={queryResult ? queryResult.facets.category.values : []}
          changeFn={filter => this.onFilterChange(filter)}
        />
        <div className="xref-select-list" ref={this.listRef}>
          <CheckboxList
            items={showSelected ? selectedCollections : getCheckboxItems()}
            selectedItems={selectedCollections.map(c => c.id)}
            onItemClick={id => this.onSelect(id)}
          />
          {queryResult && queryResult.next && !loading && <Waypoint onEnter={() => this.getMoreResults()} bottomOffset="-40px" />}
          {loading && (<Spinner />)}
        </div>
        <div className="xref-select-status">
          <div>
            <strong>
              <FormattedMessage
                id="collection.xref.select.selectStatus"
                defaultMessage={`You have selected {selectedCount, number} {selectedCount, plural,
                      one {collection}
                      other {collections}
                    }`}
                values={{ selectedCount: selectedCollections.length }}
              />
            </strong>
          </div>
          <div>
            {selectedCollections.length > 0
            && (
            <Button icon="eye-open" active={showSelected} onClick={() => this.toggleShowSelected()}>
              <FormattedMessage id="collection.xref.select.showSelected" defaultMessage="Review selection" />
            </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
}

export default injectIntl(CollectionXrefSelect);
