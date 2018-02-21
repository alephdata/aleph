import React, {Component} from 'react';
import {connect} from 'react-redux';
import {MenuItem} from '@blueprintjs/core'
import {Suggest} from "@blueprintjs/select";
import {injectIntl} from 'react-intl';

class SuggestInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      list: [],
      selectedItem: {},
      input: ''
    };

    this.itemRenderer = this.itemRenderer.bind(this);
    this.getSelectedItemIndex = this.getSelectedItemIndex.bind(this);
    this.isItemSelected = this.isItemSelected.bind(this);
    this.inputRenderer = this.inputRenderer.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      list: nextProps.list,
      input: nextProps.isCategory ? nextProps.categories[nextProps.defaultValue]
        : nextProps.defaultValue ? nextProps.defaultValue : ''
    });
  }

  itemRenderer(item, opts) {
    return opts.modifiers.matchesPredicate && <MenuItem
      key={item.id}
      onClick={opts.handleClick}
      text={item.name}
      shouldDismissPopover={false}
    />;
  }

  isItemSelected(item) {
    return this.getSelectedItemIndex(item) !== -1;
  }

  getSelectedItemIndex(item) {
    return this.state.selectedItems.indexOf(item);
  }

  inputRenderer(item) {
    return item.name
  }

  handleItemSelect(item) {
   console.log('select', item);
   this.setState({input: item.name});
    this.props.onSelectItem(item);
  }

  onInputChange({target}) {
    console.log('change', target.value)
    this.setState({input: target.value});

    this.props.onTyping(target.value);
  }

  render() {
    const {list, input} = this.state;

    return (
      <Suggest
        initialContent={<MenuItem disabled={true} text='Add new user!' />}
        className='multiple_select_input'
        noResults={<MenuItem disabled={true} text="No results." />}
        inputProps={{onChange: this.onInputChange, value: input}}
        items={list}
        itemRenderer={this.itemRenderer}
        onItemSelect={this.handleItemSelect}
        intent={false}
        popoverProps={{targetClassName: 'multiple_select_input', className: 'multiple_select_input'}}
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
