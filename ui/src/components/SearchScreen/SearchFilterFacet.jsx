import React, { Component } from 'react';
import c from 'classnames';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

import { endpoint } from 'src/app/api';
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

    this.state = {
      query: props.query,
      values: null,
    };

    this.onOpen = this.onOpen.bind(this);
  }

  componentDidUpdate(prevProps, { query }) {
    // this.setState({
    //   values: null
    // });
  }

  onOpen() {
    if (this.state.values === null) {
    //   const query = {
    //     // q: this.state.query.q,
    //     facet: 'countries',
    //     facet_size: 500,
    //     limit: 0
    //   };
    //   this.props.fetchSearchResults({filter: query}).then(({result}) => {
    //       // console.log(result);
    //       this.setState({
    //           values: result.facets.countries.values
    //       })
    //   });
      endpoint.get('search', {params: {
        // q: this.state.query.q,
        facet: 'countries',
        facet_size: 500,
        limit: 0
      }}).then(({ data }) => this.setState({
        values: data.facets.countries.values
      }));
    }
  }

  render() {
    const { currentValue, onChange } = this.props;
    const { values } = this.state;

    return (
      <Popover popoverClassName="search-filter-facet"
               position={Position.BOTTOM_RIGHT}
               popoverWillOpen={this.onOpen} inline>
        <Button rightIconName="caret-down">
          <FormattedMessage id="search.countries" defaultMessage="Countries"/>
        </Button>
        {values !== null ?
          <SearchFilterFacetList items={values} selectedItems={currentValue} onItemClick={onChange} /> :
          <Spinner className="search-filter-loading pt-large" />
        }
      </Popover>
    );
  }
}

SearchFilterFacet = connect(null, { fetchSearchResults })(SearchFilterFacet);

export default SearchFilterFacet;
