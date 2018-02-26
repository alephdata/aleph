import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Icon, Collapse, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import { fetchFacet, fetchNextFacetValues } from 'src/actions';
import { selectFacet } from 'src/selectors';
import CheckboxList from './CheckboxList';

import './SearchFacet.css';

const messages = defineMessages({
  facet_schema: {
    id: 'search.facets.facet.schema',
    defaultMessage: 'Types',
  },
  facet_collection_id: {
    id: 'search.facets.facet.collection_id',
    defaultMessage: 'Collections',
  },
  facet_languages: {
    id: 'search.facets.facet.languages',
    defaultMessage: 'Languages',
  },
  facet_emails: {
    id: 'search.facets.facet.emails',
    defaultMessage: 'Emails',
  },
  facet_phones: {
    id: 'search.facets.facet.phones',
    defaultMessage: 'Phones',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
  facet_names: {
    id: 'search.facets.facet.names',
    defaultMessage: 'Names',
  },
  facet_addresses: {
    id: 'search.facets.facet.addresses',
    defaultMessage: 'Addresses',
  },
  facet_mime_type: {
    id: 'search.facets.facet.mime_type',
    defaultMessage: 'File types',
  },
  facet_author: {
    id: 'search.facets.facet.author',
    defaultMessage: 'Authors',
  },
  clear_filter: {
    id: 'search.facets.clear_filter',
    defaultMessage: 'Clear this filter',
  },
})

class SearchFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      isOpen: props.initiallyOpen !== undefined ? props.initiallyOpen : this.isActive(),
    };

    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onClear = this.onClear.bind(this);
    this.isActive = this.isActive.bind(this);
    this.showMore = this.showMore.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps, prevState) {
    // Check for a change of query, as unconditionally calling fetchIfNeeded
    // could cause an infinite loop (if fetching fails).
    if (!this.props.query.sameAs(prevProps.query)
      || this.state.isOpen !== prevState.isOpen) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { total, values, isFetchingTotal, isFetchingValues, fetchFacet } = this.props;
    const { isOpen } = this.state;
    const fetchTotal = total === undefined && !isFetchingTotal;
    const fetchValues = isOpen && values === undefined && !isFetchingValues;
    if (fetchTotal || fetchValues) {
      const { query, field } = this.props;
      fetchFacet({ query, field, fetchTotal, fetchValues });
    }
  }

  isActive(props = this.props) {
    return props.query.getFilter(props.field).length > 0;
  }

  showMore(e) {
    e.preventDefault();
    const { query, field, fetchNextFacetValues } = this.props;
    fetchNextFacetValues({ query, field });
  }

  onClick() {
    this.setState(
      state => ({ ...state, isOpen: !state.isOpen }),
    );
  }

  onSelect(value) {
    const { field } = this.props;
    let query = this.props.query;
    query = query.toggleFilter(field, value)
    this.props.updateQuery(query)
  }

  onClear(event) {
    event.stopPropagation();
    const { field } = this.props;
    let query = this.props.query;
    query = query.clearFilter(field);
    this.props.updateQuery(query);
  }

  render() {
    const { query, field, total, values, isFetchingValues,
            isExpandingValues, valuesLimit, intl } = this.props;
    const { isOpen } = this.state;

    const current = query.getFilter(field);
    const count = current.length;
    const isActive = this.isActive();
    const fieldLabel = messages[`facet_${field}`]
      ? intl.formatMessage(messages[`facet_${field}`])
      : field;

    // The values array can include extra selected-but-zero-hit values that are
    // excluded from total, so we compare not against the array's length but
    // against the requested limit.
    const hasMoreValues = valuesLimit < total;

    return (
      <div className="SearchFacet">
        <div className={c('opener', { clickable: !!total, active: isActive })} onClick={this.onClick} style={{position: 'relative'}}>
          <Icon icon={`caret-right`} className={c('caret', {rotate: isOpen})} />
          <span className="FacetName">
            {isActive
              ? total !== undefined
                ? <FormattedMessage id="search.facets.filteringBy" defaultMessage="Filtering by {count} of {total} {fieldLabel}" values={{ fieldLabel, count, total }} />
                : <FormattedMessage id="search.facets.filteringByNoTotal" defaultMessage="Filtering by {count} {fieldLabel}" values={{ fieldLabel, count }} />
              : total !== undefined
                ? <span><FormattedMessage id="search.facets.filterBy" defaultMessage="{fieldLabel}" values={{ fieldLabel, total }} />{total > 0 && (<span className='pt-tag pt-small pt-round pt-intent-primary'><FormattedNumber value={total} /></span>)}</span>
                : <FormattedMessage id="search.facets.countingTotal" defaultMessage="Counting {fieldLabel}…" values={{ fieldLabel }} />
            }
          </span>
          {isActive && !isFetchingValues && !isExpandingValues && (
            <Button onClick={this.onClear}
              className="ClearButton pt-minimal pt-small"
              title={intl.formatMessage(messages.clear_filter)} icon="disable" />
          )}
        </div>
        <Collapse isOpen={isOpen}>
          {values !== undefined && (
            <CheckboxList items={values}
                          selectedItems={current}
                          onItemClick={this.onSelect}>
              {!isFetchingValues && !isExpandingValues && hasMoreValues && (
                <a href="#" className="ShowMore" onClick={this.showMore}>
                  <FormattedMessage id="search.facets.showMore" defaultMessage="Show more…" values={{ fieldLabel }} style={{paddingTop: 10}}/>
                </a>
              )}
            </CheckboxList>
          )}
          {(isFetchingValues || isExpandingValues) && (
            <Spinner className="pt-small spinner" />
          )}
        </Collapse>
      </div>
    );
  }
}

const mapStateToProps = (state, { query, field }) => ({
  ...selectFacet(state, { query, field }),
});

SearchFacet = injectIntl(SearchFacet);
SearchFacet = connect(mapStateToProps, { fetchFacet, fetchNextFacetValues })(SearchFacet);
export default SearchFacet;
