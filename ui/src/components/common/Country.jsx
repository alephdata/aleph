import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { MenuItem, Classes, Position } from '@blueprintjs/core';
import { MultiSelect as BlueprintMultiSelect } from "@blueprintjs/select";

import wordList from 'src/util/wordList';
import { selectMetadata } from 'src/selectors';

import './Country.css';

const messages = defineMessages({
  select: {
    id: 'country.multiselect.select',
    defaultMessage: 'Search by country name'
  },
  no_results: {
    id: 'country.multiselect.no.results',
    defaultMessage: 'No results.',
  },
});


class Name extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.code !== nextProps.code;
  }

  render() {
    const { code, countries, short = false } = this.props,
          codeLabel = code ? code.toUpperCase() : <FormattedMessage id="country.unknown" defaultMessage="Unknown"/>,
          label = short ? codeLabel : (countries[code] || codeLabel);
    
    if (!code) return null;
    return label;
  }
}

class List extends Component {
  render() {
    const { codes, countries, truncate = Infinity, short = false } = this.props;
    if (!codes) return null;

    let names = codes.map(code => (
      <Name countries={countries} code={code} key={code} short={short} />
    ));

    // Truncate if too long
    if (names.length > truncate) {
      // Cut slightly deeper than requested, as the ellipsis takes space too.
      names = [...names.slice(0, truncate), '…'];
    }
    return wordList(names, ', ');
  }
}


class MultiSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.itemRenderer = this.itemRenderer.bind(this);
    this.itemFilter = this.itemFilter.bind(this);
    this.onItemSelect = this.onItemSelect.bind(this);
    this.onRemoveTag = this.onRemoveTag.bind(this);
    this.tagRenderer = this.tagRenderer.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return { codes: nextProps.codes || [] };
  }

  itemRenderer(item, { modifiers, handleClick }) {
    if (modifiers.matchesPredicate) {
      return <MenuItem key={item}
                       className={modifiers.active ? Classes.ACTIVE : ""}
                       onClick={handleClick}
                       text={this.props.countries[item]}
      />;
    }
    
  }

  itemFilter(query, item) {
    if (!query.length || this.state.codes.indexOf(item) !== -1) {
      return false;
    }
    const label = this.props.countries[item].toLowerCase();
    return label.includes(query.toLowerCase());
  }

  tagRenderer(item) {
    return <Name code={item} countries={this.props.countries} />;
  }

  onRemoveTag(event, index) {
    const { codes } = this.state;
    codes.splice(index, 1);
    this.setState({codes});
    this.props.onChange(codes);
  }

  onItemSelect(item) {
    const { codes } = this.state;
    codes.push(item);
    this.setState({codes});
    this.props.onChange(codes);
  }

  render() {
    const { codes } = this.state;
    const { intl, countries } = this.props;
    const items = Object.keys(countries);

    return (
      <BlueprintMultiSelect
        initialContent={
          <MenuItem disabled={true} text={intl.formatMessage(messages.select)}/>
        }
        itemPredicate={this.itemFilter}
        noResults={
          <MenuItem disabled={true} text={intl.formatMessage(messages.no_results)}/>
        }
        items={items}
        itemRenderer={this.itemRenderer}
        tagRenderer={this.tagRenderer}
        onItemSelect={this.onItemSelect}
        intent={false}
        tagInputProps={{
          onRemove: this.onRemoveTag
        }}
        popoverProps={{
          position: Position.BOTTOM_LEFT,
          className: "CountryMultiSelect",
          usePortal: false
        }}
        resetOnSelect={true}
        openOnKeyDown={true}
        selectedItems={codes}
      />
    );
  }
}

const mapStateToProps = state => ({
  countries: selectMetadata(state).countries,
});

class Country extends Component {
  static Name = connect(mapStateToProps)(Name);
  static List = connect(mapStateToProps)(List);
  static MultiSelect = connect(mapStateToProps)(injectIntl(MultiSelect));
}

export default Country;
