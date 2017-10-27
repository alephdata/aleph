import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Checkbox, Dialog, NonIdealState, Spinner } from '@blueprintjs/core';
import { debounce, fromPairs, xor } from 'lodash';

import { endpoint } from '../api';

import SearchFilterList from './SearchFilterList';
import SearchFilterText from './SearchFilterText';

import './SearchFilterCollections.css';

const SearchFilterCollectionsList = ({ collections, selectedCollections, onClick }) => (
  <ul className="search-filter-collections-list">
    {collections.map(collection => (
      <li className="search-filter-collections-list-item"
          onClick={onClick.bind(null, '' + collection.id)} key={collection.id}>
        <span className="pt-icon pt-icon-globe" />
        <h6>{collection.label}</h6>
        <p>{collection.summary}</p>
        <Checkbox checked={selectedCollections.indexOf(collection.id) > -1} readOnly />
      </li>
    ))}
  </ul>
);

const SearchFilterCollectionsFacets = ({ facets, toggleFacetItem }) => (
  <div className="search-filter-collections__col">
    {facets.map(facet => (
      <div className="search-filter-collections__col__flex-row" key={facet.id}>
        <h4>{facet.label}</h4>
        <SearchFilterList items={facet.items} selectedItems={facet.selectedItems}
          onItemClick={toggleFacetItem.bind(null, facet.id)}/>
      </div>
    ))}
  </div>
);

const FACETS = [
  {id: 'category', label: 'Categories'},
  {id: 'countries', label: 'Countries'}
];

const FACET_IDS = FACETS.map(facet => facet.id);

class SearchFilterCollections extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      isStale: false,
      searchText: '',
      facets: FACETS.map(facet => ({...facet, items: [], selectedItems: []})),
      filteredCollections: null
    };

    this.fetchCollections = debounce(this.fetchCollections, 200);
    this.lastFetchTime = null;

    this.toggleOpen = this.toggleOpen.bind(this);
    this.toggleFacetItem = this.toggleFacetItem.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
  }

  componentDidUpdate({ collectionIds }) {
    if (collectionIds !== this.props.collectionIds) {
      this.setState({filteredCollections: null});
    }

    const { isOpen, isStale, filteredCollections } = this.state;
    if (isOpen && (isStale || !filteredCollections)) {
      this.fetchCollections();
    }
  }

  fetchCollections() {
    const fetchTime = Date.now();
    this.lastFetchTime = fetchTime;

    const filters = this.state.facets
      .filter(facet => facet.selectedItems.length > 0)
      .map(facet => {
        return [`filter:${facet.id}`, facet.selectedItems];
      });

    endpoint.get('collections', {params: {
        facet: FACET_IDS,
        q: this.state.searchText,
        'filter:id': this.props.collectionIds,
        ...fromPairs(filters)
      }}).then(({ data }) => {
        // Stop race conditions where an earlier fetch returns after a later one
        if (fetchTime === this.lastFetchTime) {
          this.setState({
            isStale: false,
            filteredCollections: data.results,
            facets: this.state.facets.map(facet => ({
              ...facet,
              items: data.facets[facet.id].values
            }))
          });
        }
      });
  }

  toggleOpen() {
    const isOpen = !this.state.isOpen;
    this.setState({isOpen});
    if (isOpen) {
      this.props.onOpen();
    }
  }

  toggleFacetItem(facetId, itemId) {
    const facets = this.state.facets.map(facet => {
      if (facet.id === facetId) {
        const selectedItems = xor(facet.selectedItems, [itemId]);
        return {...facet, selectedItems};
      } else {
        return facet;
      }
    });

    this.setState({facets, isStale: true});
  }

  onTextChange(searchText) {
    this.setState({searchText, isStale: true});
  }

  render() {
    const { isOpen, isStale, searchText, facets, filteredCollections } = this.state;
    const { currentValue, onChange } = this.props;

    return (
      <div>
        <Button rightIconName="caret-down" onClick={this.toggleOpen}>
          <FormattedMessage id="search.collections" defaultMessage="Collections" />
        </Button>
        <Dialog isOpen={isOpen} onClose={this.toggleOpen} title="Select collections"
                className="search-filter-collections-dialog">
          {filteredCollections !== null ?
            <div className="search-filter-collections">
              <div className="search-filter-collections__col">
                <div className="search-filter-collections__col__row">
                  <SearchFilterText onChange={this.onTextChange} currentValue={searchText}
                    showSpinner={isStale} />
                </div>
                <div className="search-filter-collections__col__flex-row">
                  {filteredCollections.length === 0 && 
                    <NonIdealState visual="search" title="No matching collections found"
                      description="Try making your search more general" />}
                  <SearchFilterCollectionsList collections={filteredCollections}
                    selectedCollections={currentValue} onClick={onChange} />
                </div>
              </div>

              <SearchFilterCollectionsFacets facets={facets}
                toggleFacetItem={this.toggleFacetItem} />
            </div> :
            <Spinner className="search-filter-loading pt-large" />}
        </Dialog>
      </div>
    );
  }
}

export default SearchFilterCollections;
