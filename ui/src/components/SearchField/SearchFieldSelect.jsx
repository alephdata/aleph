import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Button, Icon, Intent, Menu, MenuItem } from '@blueprintjs/core';

import { GROUP_FIELDS, getGroupField } from 'components/SearchField/util';
import SearchField from 'components/SearchField/SearchField';
import { SelectWrapper } from 'components/common';
import { selectModel } from 'selectors';

import './SearchFieldSelect.scss'

class SearchFieldSelect extends PureComponent {
  constructor(props) {
    super(props);

    this.getItemLabel = this.getItemLabel.bind(this);
    this.isSelected = this.isSelected.bind(this);
  }

  itemPredicate = (query, item) => {
    return this.getItemLabel(item).toLowerCase().includes(query.toLowerCase());
  }

  itemRenderer = (item, { modifiers, handleClick }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    const isSelected = this.isSelected(item);

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        onClick={handleClick}
        intent={isSelected && Intent.SUCCESS}
        label={isSelected && <Icon icon="tick" />}
        text={<SearchField.Label field={item} icon />}
        key={item.name}
      />
    );
  }

  getItemLabel(item) {
    return item.isProperty ? item.label : this.props.intl.formatMessage(item.label, { count: 0 })
  }

  isSelected(item) {
    return this.props.selected.find(({ name }) => name === item.name)
  }

  itemListRenderer = ({ items, itemsParentRef, renderItem }) => {
    const { properties, groups, onReset } = this.props;
    const [selectedGroups, availableGroups] = _.partition(groups, this.isSelected);
    const [selectedProps, availableProps] = _.partition(properties, this.isSelected);

    return (
      <>
        <Menu ulRef={itemsParentRef}>
          <li className="bp3-menu-header">
            <h6 className="bp3-heading">
              <FormattedMessage id="search.config.groups" defaultMessage="Property groups" />
            </h6>
          </li>
          {selectedGroups.map(renderItem)}
          {availableGroups.map(renderItem)}
          <li className="bp3-menu-header">
            <h6 className="bp3-heading">
              <FormattedMessage id="search.config.properties" defaultMessage="Properties" />
            </h6>
          </li>
          {selectedProps.map((...props) => renderItem(...props, true))}
          {availableProps.map(renderItem)}
        </Menu>
        {!!onReset && (
          <Button
            outlined
            icon="reset"
            fill
            intent={Intent.DANGER}
            className="SearchFieldSelect__reset"
            onClick={onReset}
          >
            <FormattedMessage id="search.config.reset" defaultMessage="Reset to default" />
          </Button>
        )}
      </>
    );
  }

  render() {
    const { children, onSelect, properties, groups, inputProps = {} } = this.props;

    return (
      <SelectWrapper
        itemPredicate={this.itemPredicate}
        itemRenderer={this.itemRenderer}
        itemListRenderer={this.itemListRenderer}
        filterable={true}
        onItemSelect={onSelect}
        items={[...groups, ...properties]}
        resetOnSelect
        resetOnQuery
        className="SearchFieldSelect"
        inputProps={inputProps}
      >
        {children}
      </SelectWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const model = selectModel(state);

  const properties = model.getProperties()
    .filter(prop => (!prop.stub && !prop.hidden))
    .sort((a, b) => a.label > b.label ? 1 : -1)

  return {
    groups: GROUP_FIELDS.map(getGroupField),
    properties: _.uniqBy(properties, 'name')
      .map(prop => ({ name: prop.name, label: prop.label, type: prop.type.name, isProperty: true }))
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(SearchFieldSelect);
