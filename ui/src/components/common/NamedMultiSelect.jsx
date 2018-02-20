import React, {Component} from 'react';
import {connect} from 'react-redux';
import {MenuItem} from '@blueprintjs/core'
import {MultiSelect} from "@blueprintjs/select";
import {FormattedMessage, injectIntl} from 'react-intl';

import Country from 'src/components/common/Country';
import Language from 'src/components/common/Language';

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

  itemRenderer(item) {
    //console.log('item renderer', item)
    return <MenuItem
      //iconName="blank"
      key={item.index}
      onClick={this.handleItemSelect.bind(this, item)}
      text={item.name}
      shouldDismissPopover={false}
    />;
  }

  tagRenderer(event, item) {
    //console.log('tag renderer', item, this.state.selectedItems);
    return this.props.isCountry ? <Country.Name code={this.state.selectedItems[item]}/> :
      <Language.Name code={this.state.selectedItems[item]}/>;
  }

  removeItem(index) {
    this.setState({selectedItems: this.state.selectedItems.filter((item, i) => i !== index)});
  }

  selectItem(item) {
    console.log('select', item)
    let selectedItems = this.state.selectedItems;
    selectedItems.push(item.item.index);
    let list = this.removeFromList(item.item.index);

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
    return this.getSelectedItemIndex(item) !== -1;
  }

  getSelectedItemIndex(item) {
    //console.log('get selected', item)
    return this.state.selectedItems.indexOf(item);
  }

  handleItemSelect(item) {
    //console.log('handle item', this.isItemSelected(item))
    if (!this.isItemSelected(item)) {
      this.selectItem(item);
    } else {
      this.removeItem(this.getSelectedItemIndex(item));
    }
  }

  testMethod(){
    console.log('test method')
  }

  handleChange(query, item) {
    //console.log('handle change', query, item)
    if (query !== '') {
      query = query.toLowerCase();
      if(item.name.toLowerCase().includes(query)) return item;
    } else {
      return item;
    }
  }

  render() {
    const {selectedItems, list} = this.state;

    return (
              <MultiSelect
                initialContent={<MenuItem disabled={true} text='Add new item!' />}
                className='multiple_select_input'
                itemPredicate={this.handleChange.bind(this)}
                noResults={<MenuItem disabled={true} text="No results."/>}
                inputProps={{onChange: this.handleChange}}
                items={list}
                itemRenderer={this.itemRenderer}
                tagRenderer={this.tagRenderer}
                onItemSelect={this.testMethod}
                intent={false}
                popoverProps={{targetClassName: 'multiple_select_input'}}
                resetOnSelect={true}
                selectedItems={selectedItems}/>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    countries: state.metadata.countries
  }
};

export default connect(mapStateToProps)(injectIntl(NamedMultiSelect));
