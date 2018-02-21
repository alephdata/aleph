import React, {Component} from 'react';
import {connect} from 'react-redux';
import {MenuItem} from '@blueprintjs/core'
import {Suggest} from "@blueprintjs/select";
import {FormattedMessage, injectIntl} from 'react-intl';

class SuggestInput extends Component {
  constructor(props) {
    super(props);

    console.log('constructor', this.props)
    this.state = {
      list: [],
      selectedItem: {},
      input: this.props.defaultValue ? this.props.isCategory ? this.props.categories[this.props.defaultValue]
        ? this.props.defaultValue : '' : '' : ''
    };

    this.itemRenderer = this.itemRenderer.bind(this);
    this.getSelectedItemIndex = this.getSelectedItemIndex.bind(this);
    this.isItemSelected = this.isItemSelected.bind(this);
    this.inputRenderer = this.inputRenderer.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.handleItemSelect = this.handleItemSelect.bind(this);
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      list: nextProps.list
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
    this.props.onSelectItem(item);

    return item.name
  }

  handleItemSelect(item) {
   console.log('select', item);
   this.setState({input: item.name});
  }

  onInputChange({target}) {
    this.setState({input: target.value});

    this.props.onTyping(target.value);
  }

  render() {
    const {list} = this.state;

    return (
      <Suggest
        initialContent={<MenuItem disabled={true} text='Add new user!' />}
        className='multiple_select_input'
        noResults={<MenuItem disabled={true} text="No results." />}
        inputProps={{onChange: this.onInputChange, value: this.state.input}}
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
