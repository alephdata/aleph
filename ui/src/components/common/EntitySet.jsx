import React, { PureComponent } from 'react';
import { Button, Icon, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import c from 'classnames';
import getEntitySetLink from 'util/getEntitySetLink';


const ICONS = {
  diagram: 'graph',
  timeline: 'timeline-events',
  list: 'list'
}


const getIcon = ({ type }) => ICONS[type] || ICONS.list;


class EntitySetLabel extends PureComponent {
  render() {
    const { entitySet, icon } = this.props;
    if (!entitySet || !entitySet.id) {
      return null;
    }

    return (
      <span className="EntitySetLabel" title={entitySet.label}>
        {icon && <Icon icon={getIcon(entitySet)} className="left-icon" />}
        <span>{entitySet.label}</span>
      </span>
    );
  }
}

class EntitySetLink extends PureComponent {
  render() {
    const { entitySet, className } = this.props;
    const content = <EntitySet.Label {...this.props} />;

    return <Link to={getEntitySetLink(entitySet)} className={c('EntitySetLink', className)}>{content}</Link>;
  }
}

class EntitySetSelect extends PureComponent {
  itemRenderer = (entitySet, {handleClick}) => {
    return (
      <MenuItem
        key={entitySet.id}
        onClick={handleClick}
        text={<EntitySetLabel entitySet={entitySet} icon />}
      />
    );
  }

  render() {
    const { buttonProps, items, noResults, onSelect } = this.props;

    return (
      <Select
        itemRenderer={this.itemRenderer}
        items={items}
        onItemSelect={onSelect}
        popoverProps={{ minimal: true, fill: true, position: "auto-start" }}
        inputProps={{ fill: true }}
        filterable={false}
        noResults={<span className="error-text">{noResults}</span>}
        resetOnClose
        resetOnSelect
      >
        <Button
          fill
          icon="graph"
          rightIcon="caret-down"
          alignText="left"
          {...buttonProps}
        />
      </Select>
    )
  }
}

class EntitySet {
  static Label = EntitySetLabel;

  static Link = withRouter(EntitySetLink);

  static Select = EntitySetSelect;
}

export default EntitySet;
