import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Popover, Position } from '@blueprintjs/core';
import { without, union } from 'lodash/fp';

import messages from 'src/content/messages';
import SearchFilterFacet from './SearchFilterFacet';
import CheckboxList from './CheckboxList';

import './SearchFilterFacets.css';

class SearchFilterFacets extends Component {
  constructor(props) {
    super(props);

    this.toggleFacet = this.toggleFacet.bind(this);
  }

  toggleFacet(filterName) {
    const { query, updateQuery } = this.props;
    updateQuery(query.toggleUiFacet(filterName), { replace: true });
  }

  render() {
    const { aspects, query, updateQuery, intl } = this.props;

    const possibleFacets = [
      'countries',
      'languages',
      'emails',
      'phones',
      'names',
      'addresses',
      'mime_type',
      'author',
    ];

    let shownFacets = query.getUiFacets();
    if (aspects.collections) {
      // The Collections facet is treated specially. Always show it (if sensible).
      shownFacets = union(['collection_id'])(shownFacets);
    }

    const getLabel = filterName => intl.formatMessage(messages.search.filter[filterName]);

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
        {possibleFacets && (
          <Popover
            position={Position.BOTTOM_RIGHT}
            inline
          >
            <Button iconName="filter" rightIconName="caret-down">
              <FormattedMessage id="search.addAFilter" defaultMessage="Filters" />
            </Button>
            <CheckboxList
              items={possibleFacets.map(name => ({ id: name, label: getLabel(name) }))}
              selectedItems={shownFacets}
              onItemClick={this.toggleFacet}
            />
          </Popover>
        )}
      </div>
    );
  }
}

SearchFilterFacets = injectIntl(SearchFilterFacets);
export default SearchFilterFacets;
