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
      list: mockList,
      selectedItem: {}
    };

    this.itemRenderer = this.itemRenderer.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.getSelectedItemIndex = this.getSelectedItemIndex.bind(this);
    this.isItemSelected = this.isItemSelected.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
    this.filterList = this.filterList.bind(this);
    this.removeFromList = this.removeFromList.bind(this);
    this.inputRenderer = this.inputRenderer.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      list: nextProps.list
    });
  }

  itemRenderer(item, opts) {
    console.log('item renderer', opts)
    return opts.modifiers.matchesPredicate && <MenuItem
      key={item.id}
      onClick={opts.handleClick}
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

  filterList(query, item) {
    console.log('handle change', query, item);
    if (query !== '') {
      query = query.toString().toLowerCase();
      if(item !== undefined) {
        return item.name.toLowerCase().includes(query);

      }
    } else if(query !== undefined) {
      return true;
    }

    return false;
  }

  inputRenderer(item) {
    this.props.onSelectItem(item);

    return item.name
  }

  render() {
    const {list} = this.state;
    console.log('listt', list);

    return (
      <Suggest
        initialContent={<MenuItem disabled={true} text='Add new user!' />}
        className='multiple_select_input'
        //itemPredicate={this.filterList.bind(this)}
        noResults={<MenuItem disabled={true} text="No results." />}
        inputProps={{onChange: this.props.onTyping}}
        items={list}
        itemRenderer={this.itemRenderer}
        onItemSelect={this.handleItemSelect}
        intent={false}
        popoverProps={{targetClassName: 'multiple_select_input', popoverClassName: 'multiple_select_input'}}
        closeOnSelect={true}
        inputValueRenderer={this.inputRenderer}/>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {

  }
};

export default connect(mapStateToProps)(injectIntl(SuggestInput));
