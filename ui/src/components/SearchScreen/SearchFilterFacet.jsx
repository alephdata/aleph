import React, { Component } from 'react';
import c from 'classnames';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import { fetchSearchResults } from 'src/actions';

import './SearchFilterFacet.css';


const SearchFilterFacetTick = ({ isTicked }) => (
  <span className={c('pt-icon-standard', 'search-tick', {'is-ticked': isTicked})} />
);

const SearchFilterFacetList = ({ items, selectedItems, onItemClick }) => (
  <ul className="search-filter-list">
    {items
      .sort((a, b) => a.label < b.label ? -1 : 1)
      .map(item => (
        <li className="search-filter-list-item" onClick={onItemClick.bind(null, item.id)} key={item.id}>
          <SearchFilterFacetTick isTicked={selectedItems.indexOf(item.id) > -1} />
          <span>{item.label}</span>
          <span><FormattedNumber value={item.count} /></span>
        </li>
      ))}
  </ul>
);

class SearchFilterFacet extends Component {
  constructor(props)  {
    super(props);

    this.state = {values: null};

    this.onOpen = this.onOpen.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidUpdate(prevProps, nextProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchValues();
    }
  }

  fetchValues() {
    const { field } = this.props;
    let query = this.props.query;
    query = query.limit(0);
    query = query.clearFacets().addFacet(field);
    query = query.set('facet_size', 500);
    let params = query.toParams();
    this.props.fetchSearchResults({filters: params}).then(({result}) => {
      this.setState({
          values: result.facets[field].values
      })
    });
  }

  onOpen() {
    if (this.state.values === null) {
      this.fetchValues();
    }
  }

  onSelect(value) {
    const { field } = this.props;
    let query = this.props.query;
    query = query.toggleFilter(field, value)
    this.props.updateQuery(query)
  }

  render() {
    const { query, children, field } = this.props;
    const { values } = this.state;
    const current = query.getFilter(field);

    return (
      <Popover popoverClassName="search-filter-facet"
               position={Position.BOTTOM_RIGHT}
               popoverWillOpen={this.onOpen} inline>
        <Button rightIconName="caret-down">
          {children}
        </Button>
        {values !== null ?
          <SearchFilterFacetList items={values}
                                 selectedItems={current}
                                 onItemClick={this.onSelect} /> :
          <Spinner className="search-filter-loading pt-large" />
        }
      </Popover>
    );
  }
}

SearchFilterFacet = connect(null, { fetchSearchResults })(SearchFilterFacet);
export default SearchFilterFacet;
