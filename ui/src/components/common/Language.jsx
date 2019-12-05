import React, { PureComponent, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import wordList from 'src/util/wordList';
import { selectMetadata } from 'src/selectors';
import { Classes, MenuItem, Position } from '@blueprintjs/core';
import { MultiSelect as BlueprintMultiSelect } from '@blueprintjs/select';


class Name extends PureComponent {
  render() {
    const { code, languages } = this.props;
    const codeLabel = code ? code.toUpperCase() : <FormattedMessage id="language.unknown" defaultMessage="Unknown" />;
    const label = languages[code] || codeLabel;

    console.log(code, label, languages);

    if (!code) return null;
    return label;
  }
}

class List extends Component {
  render() {
    const { codes, languages } = this.props;
    if (!codes || codes.length === 0) {
      return null;
    }
    const names = codes.map(code => <Name languages={languages} code={code} key={code} />);
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

  static getDerivedStateFromProps(nextProps) {
    return { codes: nextProps.codes || [] };
  }

  onRemoveTag(event, index) {
    const { codes } = this.state;
    codes.splice(index, 1);
    this.setState({ codes });
    this.props.onChange(codes);
  }

  onItemSelect(item, event) {
    event.stopPropagation();
    const { codes } = this.state;
    codes.push(item);
    this.setState({ codes });
    this.props.onChange(codes);
  }

  tagRenderer(item) {
    return <Name code={item} languages={this.props.languages} />;
  }

  itemFilter(query, item) {
    if (!query.length || this.state.codes.indexOf(item) !== -1) {
      return false;
    }
    const label = this.props.languages[item].toLowerCase();
    return label.includes(query.toLowerCase());
  }

  itemRenderer(item, { modifiers, handleClick }) {
    if (modifiers.matchesPredicate) {
      return (
        <MenuItem
          key={item}
          className={modifiers.active ? Classes.ACTIVE : ''}
          onClick={handleClick}
          text={this.props.languages[item]}
        />
      );
    }
    return undefined;
  }

  render() {
    const { codes } = this.state;
    const { languages } = this.props;
    const items = Object.keys(languages);

    return (
      <BlueprintMultiSelect
        initialContent={
          <MenuItem disabled text={<FormattedMessage id="language.multiselect.select" defaultMessage="Select" />} />
        }
        itemPredicate={this.itemFilter}
        noResults={
          <MenuItem disabled text={<FormattedMessage id="language.multiselect.no.result" defaultMessage="No Result" />} />
        }
        items={items}
        itemRenderer={this.itemRenderer}
        tagRenderer={this.tagRenderer}
        onItemSelect={this.onItemSelect}
        intent={false}
        tagInputProps={{
          onRemove: this.onRemoveTag,
        }}
        popoverProps={{
          position: Position.BOTTOM_LEFT,
          className: 'CountryMultiSelect',
          usePortal: false,
        }}
        resetOnSelect
        openOnKeyDown
        selectedItems={codes}
      />
    );
  }
}


const mapStateToProps = state => ({
  languages: selectMetadata(state).languages,
});

class Language extends Component {
  static Name = connect(mapStateToProps)(Name);

  static MultiSelect = connect(mapStateToProps)(MultiSelect)

  static List = connect(mapStateToProps)(List);
}

export default Language;
