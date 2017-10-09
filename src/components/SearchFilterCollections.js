import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

const mapStateToProps = ({ collections },  { collection }) => ({
  // Use more detailed collection data if we have it, fallback to basic
  // TEMP: parseInt until collection ids are made to be strings
  // https://github.com/alephdata/aleph/issues/224
  collection: collections[parseInt(collection.id, 10)] || collection
});

const SearchFilterCollectionsItem = connect(mapStateToProps)(({ collection }) => (
  <li>
    <p>{ collection.label }</p>
    <p>{ collection.summary }</p>
  </li>
));

const SearchFilterCollections = ({ loaded, collections, currentValue, onOpen, onChange }) => (
  <Popover position={Position.BOTTOM} popoverWillOpen={onOpen} inline>
      <Button rightIconName="caret-down">
        <FormattedMessage id="search.collections" defaultMessage="Collections"/>
        {loaded && <span> (<FormattedNumber value={collections.length} />)</span>}
      </Button>
      <div className="search-filter-collections">
        {loaded ?
          <ul className="search-filter-collections-list">
            {collections.map(collection => (
              <SearchFilterCollectionsItem collection={collection} key={collection.id} />
            ))}
          </ul> :
          <Spinner className="pt-large" />}
      </div>
  </Popover>
);

export default SearchFilterCollections;
