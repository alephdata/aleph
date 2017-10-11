import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Dialog, Spinner } from '@blueprintjs/core';
import { keyBy, xor, debounce, fromPairs } from 'lodash';

import { endpoint } from '../api';

import SearchFilterTick from './SearchFilterTick';
import SearchFilterText from './SearchFilterText';

import './SearchFilterCollections.css';

const SearchFilterCollectionsList = ({ collections, details, onClick }) => (
  <ul className="search-filter-collections-list">
    {collections.map(collection => (
      <li key={collection.id} onClick={onClick.bind(null, collection.id)}>
        <h6>{ collection.label }</h6>
        {details[collection.id] && <p>{ details[collection.id].summary }</p>}
      </li>
    ))}
  </ul>
);

const SearchFilterCollectionsFacets = ({ facets, onClick }) => (
  <div className="search-filter-collections__col">
    {facets.map(facet => (
      <div className="search-filter-collections__col__flex-row" key={facet.id}>
        <h4>{facet.label}</h4>
        <ul className="search-filter-collections-facet">
          {facet.items.map(item => (
            <li key={item.id} onClick={onClick.bind(null, facet.id, item.id)}>
              <SearchFilterTick isTicked={facet.selectedItems.indexOf(item.id) > -1} />
              {item.label}
            </li>
          ))}
        </ul>
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
      text: '',
      collections: [],
      details: {},
      facets: FACETS.map(facet => ({...facet, items: [], selectedItems: []})),
      loaded: false
    };

    this.fetchCollections = debounce(this.fetchCollections, 200);

    this.toggleOpen = this.toggleOpen.bind(this);
    this.toggleFacetItem = this.toggleFacetItem.bind(this);
    this.toggleCollection = this.toggleCollection.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
  }

  componentDidUpdate({ queryText }, { text }) {
    if (queryText !== this.props.queryText || text !== this.state.text) {
      // Don't show loading while category searching is in progress
      this.setState({ loaded: queryText === this.props.queryText });

      if (this.state.isOpen) {
        this.fetchCollections();
      }
    }
  }

  fetchCollections() {
    endpoint.get('search', {params: {q: this.props.queryText, facet: 'collection_id'}})
      .then(response => {
        const collections = response.data.facets.collection_id.values;

        this.setState({collections, loaded: true});

        const filters = this.state.facets
          .filter(facet => facet.selectedItems.length > 0)
          .map(facet => {
            return [`filter:${facet.id}`, facet.selectedItems];
          });

        return endpoint.get('collections', {params: {
          'facet': FACET_IDS,
          'q': this.state.text,
          'filter:id': collections.map(collection => collection.id),
          ...fromPairs(filters)
        }});
      })
      .then(response => {
        this.setState({
          details: keyBy(response.data.results, 'id'),
          facets: this.state.facets.map(facet => ({
            ...facet,
            items: response.data.facets[facet.id].values
          }))
        });
      });
  }

  toggleOpen() {
    const isOpen = !this.state.isOpen;
    this.setState({ isOpen });

    if (isOpen && !this.state.loaded) {
      this.fetchCollections();
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

    this.setState({facets});
    this.fetchCollections();
  }

  toggleCollection(collectionId) {
    const { currentValue, onChange } = this.props;
    const newValue = xor(currentValue, [collectionId]);
    onChange(newValue);
  }

  onTextChange(text) {
    this.setState({text});
  }

  render() {
    const { isOpen, loaded, text, collections, details, facets } = this.state;

    return (
      <div>
        <Button rightIconName="caret-down" onClick={this.toggleOpen}>
          <FormattedMessage id="search.collections" defaultMessage="Collections"/>
          {loaded && <span> (<FormattedNumber value={collections.length} />)</span>}
        </Button>
        <Dialog isOpen={isOpen} onClose={this.toggleOpen} title="Select collections"
                className="search-filter-collections-dialog">
          {loaded ?
            <div className="search-filter-collections">
              <div className="search-filter-collections__col">
                <div className="search-filter-collections__col__row">
                  <SearchFilterText onChange={this.onTextChange} currentValue={text} />
                </div>
                <div className="search-filter-collections__col__flex-row">
                  <SearchFilterCollectionsList collections={collections} details={details} onClick={this.toggleCollection} />
                </div>
              </div>

              <SearchFilterCollectionsFacets facets={facets} onClick={this.toggleFacetItem} />
            </div> :
            <Spinner className="search-filter-loading pt-large" />}
        </Dialog>
      </div>
    );
  }
}

export default SearchFilterCollections;
