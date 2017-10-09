import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

const mapStateToProps = ({ collections },  { collection }) => ({
  collection: collections[collection.id] || collection
});

const SearchFilterCollectionsItem = connect(mapStateToProps)(collection => (
  <li>{ collection.name }</li>
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
