import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Dialog, Spinner } from '@blueprintjs/core';

import './SearchFilterCollections.css';

const SearchFilterCollectionsList = ({ collections, details }) => (
  <div className="search-filter-collections-col">
    <div className="search-filter-collections-col__row">
      <div className="pt-input-group pt-large">
        <span className="pt-icon pt-icon-search"/>
        <input className="search-input pt-input" type="search" />
      </div>
    </div>
    <div className="search-filter-collections-col__flex-row">
      <ul className="search-filter-collections-list">
        {collections.map(collection => (
          <li key={collection.id}>
            <h6>{ collection.label }</h6>
            {details[collection.id] && <p>{ details[collection.id].summary }</p>}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const SearchFilterCollectionsFilter = ({ categories, countries }) => (
  <div className="search-filter-collections-col">
    <div className="search-filter-collections-col__flex-row">
      <h4>Categories</h4>
      <ul className="search-filter-collections-facet">
        {categories.map(category => <li key={category.id}>{category.label}</li>)}
      </ul>
    </div>
    <div className="search-filter-collections-col__flex-row">
      <h4>Countries</h4>
      <ul className="search-filter-collections-facet">
        {countries.map(country => <li key={country.id}>{country.label}</li>)}
      </ul>
    </div>
  </div>
);

class SearchFilterCollections extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };

    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog() {
    const isOpen = !this.state.isOpen;
    this.setState({ isOpen });

    if (isOpen) {
      this.props.onOpen();
    }
  }

  render() {
    const { isOpen } = this.state;
    const { loaded, collections, details, categories, countries } = this.props;

    return (
    <div>
      <Button rightIconName="caret-down" onClick={this.toggleDialog}>
        <FormattedMessage id="search.collections" defaultMessage="Collections"/>
        {loaded && <span> (<FormattedNumber value={collections.length} />)</span>}
      </Button>
      <Dialog isOpen={isOpen} onClose={this.toggleDialog} className="search-filter-collections">
        {loaded ?
          // Doesn't use wrapping element so these are a direct descedent of Dialog
          // and can use its flexbox
          [
            <SearchFilterCollectionsList collections={collections} details={details} key={1} />,
            <SearchFilterCollectionsFilter categories={categories} countries={countries} key={2} />
          ] :
          <Spinner className="search-filter-loading pt-large" />}
      </Dialog>
    </div>
    );
  }
}

export default SearchFilterCollections;
