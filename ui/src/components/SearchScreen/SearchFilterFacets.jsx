import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Menu, MenuItem, Button, Popover, Position } from '@blueprintjs/core';
import { without } from 'lodash/fp';

import messages from 'src/content/messages';
import SearchFilterFacet from './SearchFilterFacet';

import './SearchFilterFacets.css';

class SearchFilterFacets extends Component {
  constructor(props) {
    super(props);

    this.showFacet = this.showFacet.bind(this);
  }

  showFacet(filterName) {
    const { query, updateQuery } = this.props;
    updateQuery(query.showUiFacet(filterName));
  }

  render() {
    const { aspects, query, updateQuery, intl } = this.props;

    let possibleFacets = [
      'collection_id',
      'countries',
      'languages',
      // 'emails',
      // 'phones',
      // 'names',
      // 'addresses',
      // 'mime_type',
      // 'author',
    ];
    if (!aspects.collections) {
      possibleFacets = without(['collection_id'])(possibleFacets);
    }

    const getLabel = filterName => intl.formatMessage(messages.search.filter[filterName]);

    const shownFacets = query.getUiFacets();
    const addFilterOptions = without(shownFacets)(possibleFacets);

    return (
      <div className="SearchFilterFacets pt-large">
        {shownFacets.map(filterName => (
          <SearchFilterFacet
            query={query}
            updateQuery={updateQuery}
            field={filterName}
            key={filterName}
          >
            {getLabel(filterName)}
          </SearchFilterFacet>
        ))}
        {addFilterOptions && (
          <Popover
            position={Position.BOTTOM_RIGHT}
            inline
          >
            <Button iconName="filter">
              <FormattedMessage id="search.addAFilter" defaultMessage="Add a filter" />
            </Button>
            <Menu>
              {addFilterOptions.map(filterName => (
                <MenuItem
                  text={getLabel(filterName)}
                  onClick={() => this.showFacet(filterName)}
                  key={filterName}
                />
              ))}
            </Menu>
          </Popover>
        )}
      </div>
    );
  }
}

SearchFilterFacets = injectIntl(SearchFilterFacets);
export default SearchFilterFacets;
