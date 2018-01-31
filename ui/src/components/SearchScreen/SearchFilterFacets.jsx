import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Menu, MenuItem, Button, Popover, Position } from '@blueprintjs/core';
import { update, union, without } from 'lodash/fp';

import messages from 'src/content/messages';
import SearchFilterFacet from './SearchFilterFacet';

import './SearchFilterFacets.css';

class SearchFilterFacets extends Component {
  constructor(props) {
    super(props);

    const { aspects, intl } = this.props;

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
    let initialFacets = [];

    if (aspects.collections) {
      initialFacets.push('collection_id');
    } else {
      possibleFacets = without(['collection_id'])(possibleFacets);
    }

    this.state = {
      possibleFacets,
      shownFacets: initialFacets,
    };

    this.addFacet = this.addFacet.bind(this);
  }

  addFacet(filterName) {
    this.setState(
      state => update('shownFacets', union([filterName]))(state)
    );
  }

  render() {
    const { query, updateQuery, intl } = this.props;
    const { possibleFacets, shownFacets } = this.state;

    const getLabel = filterName => intl.formatMessage(messages.search.filter[filterName]);

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
                  onClick={() => this.addFacet(filterName)}
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
