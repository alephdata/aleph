import React, {Component} from 'react';
import {connect} from 'react-redux';
import {MenuItem} from '@blueprintjs/core'
import {Suggest} from "@blueprintjs/select";
import {FormattedMessage, injectIntl} from 'react-intl';

const mockList = [
  {
    id: 1,
    name: 'jedan'
  },
  {
    id: 2,
    name: 'dva'
  },
  {
    id: 3,
    name: 'tri'
  },
];

class SuggestInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      list: mockList
    };

    this.itemRenderer = this.itemRenderer.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.getSelectedItemIndex = this.getSelectedItemIndex.bind(this);
    this.isItemSelected = this.isItemSelected.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.removeFromList = this.removeFromList.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      //list: nextProps.list
    });
  }

  itemRenderer(item) {
    return <MenuItem
      key={item.id}
      onClick={this.handleItemSelect.bind(this, item)}
      text={item.name}
      shouldDismissPopover={false}
    />;
  }

  removeItem(index) {
    this.setState({selectedItems: this.state.selectedItems.filter((item, i) => i !== index)});
  }

  selectItem(item) {
    console.log('select', item)
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
    console.log('get selected', item)
    return this.state.selectedItems.indexOf(item);
  }

  handleItemSelect(item) {
    console.log('handle item', item)
  }

  handleChange(query, item) {
    return false;
    console.log('handle change', query, item)
    if (query !== '') {
      query = query.toString().toLowerCase();
      if(item !== undefined) {
        console.log('IF', item.name.toLowerCase().includes(query))
        if(item.name.toLowerCase().includes(query)) {
          console.log('UNUTRA')
          return true;
        }
        return false;
      }
    } else if(query !== undefined) {
      console.log('ELSE')
      return true;
    }

    return false;
  }

  testing() {
    console.log('testing');
  }

  inputRenderer(event, item) {
    console.log('INPUT VALUE RENDERER')
    return item.name
  }

  render() {
    const {list} = this.state;
    console.log('listt', list);

    return (
      <Suggest
        initialContent={<MenuItem disabled={true} text='Add new user!' />}
        className='multiple_select_input'
        //itemPredicate={this.handleChange.bind(this)}
        noResults={<MenuItem disabled={true} text="No results." />}
        inputProps={{onChange: this.handleChange}}
        items={list}
        itemRenderer={this.itemRenderer}
        onItemSelect={this.testing}
        //intent={false}
        popoverProps={{targetClassName: 'multiple_select_input'}}
        closeOnSelect={true}
        minimal={true}
        inputValueRenderer={this.inputRenderer}
        openOnKeyDown={false}/>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {

  }
};

export default connect(mapStateToProps)(injectIntl(SuggestInput));
