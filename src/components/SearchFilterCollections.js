import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Dialog, Spinner } from '@blueprintjs/core';

import './SearchFilterCollections.css';

const mapStateToProps = ({ collections },  { collection }) => ({
  // Use more detailed collection data if we have it, fallback to basic
  // TEMP: parseInt until collection ids are made to be strings
  // https://github.com/alephdata/aleph/issues/224
  collection: collections.results[parseInt(collection.id, 10)] || collection
});

const SearchFilterCollectionsItem = connect(mapStateToProps)(({ collection }) => (
  <li>
    <h6>{ collection.label }</h6>
    <p>{ collection.summary }</p>
  </li>
));

const SearchFilterCollectionsList = ({ collections }) => (
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
          <SearchFilterCollectionsItem collection={collection} key={collection.id} />
        ))}
      </ul>
    </div>
  </div>
);

const SearchFilterCollectionsFilter = () => (
  <div className="search-filter-collections-col">
    <div className="search-filter-collections-col__flex-row">
      <h4>Categories</h4>
      stuff here
    </div>
    <div className="search-filter-collections-col__flex-row">
      <h4>Collections</h4>
      here too
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
    const { loaded, collections } = this.props;

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
            <SearchFilterCollectionsList collections={collections} key={1} />,
            <SearchFilterCollectionsFilter key={2} />
          ] :
          <Spinner className="search-filter-loading pt-large" />}
      </Dialog>
    </div>
    );
  }
}

export default SearchFilterCollections;
