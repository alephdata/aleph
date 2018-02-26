import React, {Component} from 'react';
import {connect} from 'react-redux';
import {MenuItem, Classes} from '@blueprintjs/core'
import {MultiSelect} from "@blueprintjs/select";
import { defineMessages, injectIntl } from 'react-intl';

import Country from 'src/components/common/Country';
import Language from 'src/components/common/Language';

const messages = defineMessages({
  add: {
    id: 'named.multiselect.add',
    defaultMessage: 'Add new item!'
  },
  no_results: {
    id: 'named.multiselect.no.results',
    defaultMessage: 'No results.',
  },
});

class NamedMultiSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedItems: [],
      list: []
    };

    this.itemRenderer = this.itemRenderer.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.getSelectedItemIndex = this.getSelectedItemIndex.bind(this);
    this.isItemSelected = this.isItemSelected.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.tagRenderer = this.tagRenderer.bind(this);
    this.removeFromList = this.removeFromList.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedItems: nextProps.selectedItems === undefined ? [] : nextProps.selectedItems,
      list: nextProps.list
    });
  }

  itemRenderer(item, opts) {
    return opts.modifiers.matchesPredicate && <MenuItem
      key={item.index}
      onClick={opts.handleClick}
      text={item.name}
      shouldDismissPopover={false}
    />;
  }

  tagRenderer(event, item) {
    return this.props.isCountry ? <Country.Name code={this.state.selectedItems[item]}/> :
      <Language.Name code={this.state.selectedItems[item]}/>;
  }

  removeItem(index) {
    this.setState({selectedItems: this.state.selectedItems.filter((item, i) => i !== index)});

    this.props.onSelectItem({
      selectedItems: this.state.selectedItems.filter((item, i) => i !== index),
      list: this.state.list
    });
  }

  selectItem(item) {
    let selectedItems = this.state.selectedItems;
    selectedItems.push(item.index);
    let list = this.removeFromList(item.index);

    this.props.onSelectItem({selectedItems: selectedItems, list: list});
  }

  removeFromList(index) {
    let array = [];
    for (let i = 0; i < this.state.list.length; i++) {
      if (this.state.list[i].index !== index) {
        array.push(this.state.list[i]);
      }
    }

    return array;
  }

  isItemSelected(item) {
    for (let i = 0; i < this.state.selectedItems.length; i++) {
      if (this.state.selectedItems[i].name === item.name) return true;
    }
    return false;
  }

  getSelectedItemIndex(item) {
    for (let i = 0; i < this.state.selectedItems.length; i++) {
      if (this.state.selectedItems[i] === item.props.code) return i;
    }

    return -1;
  }

  handleItemSelect(item) {
    if (!this.isItemSelected(item)) {
      this.selectItem(item);
    } else {
      this.removeItem(this.getSelectedItemIndex(item));
    }
  }

  handleChange(query, item) {
    if (query !== '') {
      query = query.toLowerCase();
      return item.name.toLowerCase().includes(query);
    } else {
      return true;
    }
  }

  render() {
    const {selectedItems, list} = this.state;
    const {intl} = this.props;

    return (
      <MultiSelect
        initialContent={<MenuItem disabled={true} text={intl.formatMessage(messages.add)}/>}
        className='multiple_select_input'
        itemPredicate={this.handleChange.bind(this)}
        noResults={<MenuItem disabled={true} text={intl.formatMessage(messages.no_results)}/>}
        inputProps={{onChange: this.handleChange}}
        items={list}
        itemRenderer={this.itemRenderer}
        tagRenderer={this.tagRenderer}
        onItemSelect={this.handleItemSelect}
        intent={false}
        popoverProps={{targetClassName: 'multiple_select_input', popoverClassName: Classes.MINIMAL}}
        tagInputProps={{onRemove: this.handleItemSelect}}
        resetOnSelect={true}
        selectedItems={selectedItems}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    countries: state.metadata.countries
  }
};

export default connect(mapStateToProps)(injectIntl(NamedMultiSelect));
