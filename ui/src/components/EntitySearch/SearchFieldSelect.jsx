import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Property as FTMProperty } from '@alephdata/followthemoney';
import { Icon, Intent, Menu, MenuItem } from '@blueprintjs/core';

import getFacetConfig from 'util/getFacetConfig';
import { Facet, Property, SelectWrapper } from 'components/common';
import { selectModel } from 'selectors';

const TYPES = [
  'dates', 'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes'
];

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
        text={<Facet.Label facet={item} />}
        key={item.field}
      />
    );
  }

  getItemLabel(item) {
    return item.isProperty ? item.label : this.props.intl.formatMessage(item.label, { count: 0 })
  }

  isSelected(item) {
    return this.props.selected.find(({ field }) => field === item.field)
  }

  itemListRenderer = ({ items, itemsParentRef, renderItem }) => {
    const { properties, selected, types } = this.props;
    const [selectedTypes, availableTypes] = _.partition(types, this.isSelected);
    const [selectedProps, availableProps] = _.partition(properties, this.isSelected);

    return (
      <Menu ulRef={itemsParentRef}>
        <li className="bp3-menu-header"><h6 className="bp3-heading">Groups</h6></li>
        {selectedTypes.map(renderItem)}
        {availableTypes.map(renderItem)}
        <li className="bp3-menu-header"><h6 className="bp3-heading">Properties</h6></li>
        {selectedProps.map((...props) => renderItem(...props, true))}
        {availableProps.map(renderItem)}
      </Menu>
    );
  }

  render() {
    const { children, onSelect, properties, types } = this.props;

    return (
      <SelectWrapper
        itemPredicate={this.itemPredicate}
        itemRenderer={this.itemRenderer}
        itemListRenderer={this.itemListRenderer}
        filterable={true}
        onItemSelect={this.props.onSelect}
        items={[...types, ...properties]}
      >
        {children}
      </SelectWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { selected } = ownProps;
  const model = selectModel(state);

  const properties = model.getProperties()
    .filter(({ matchable, hidden, name }) => (matchable && !hidden))
    .sort((a, b) => a.label > b.label ? 1 : -1)

  return {
    types: TYPES.map(getFacetConfig),
    properties: _.uniqBy(properties, 'name')
      .map(prop => ({ field: prop.name, label: prop.label, isProperty: true }))
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(SearchFieldSelect);
