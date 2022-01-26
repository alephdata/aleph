import React, { PureComponent } from 'react';
import truncateText from 'truncate';
import { Button, Icon, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Link } from 'react-router-dom';
import c from 'classnames';

import withRouter from 'app/withRouter'
import getEntitySetLink from 'util/getEntitySetLink';

const ICONS = {
  diagram: 'graph',
  timeline: 'gantt-chart',
  profile: 'layers',
  list: 'list'
}

const getIcon = ({ type }) => ICONS[type] || ICONS.list;

const EntitySetIcon = ({ entitySet, className, iconSize }) => {
  if (!entitySet) return null;

  return (
    <Icon icon={getIcon(entitySet)} className={className} iconSize={iconSize} />
  );
}

class EntitySetLabel extends PureComponent {
  render() {
    const { entitySet, icon, truncate, className } = this.props;
    if (!entitySet || !entitySet.id) {
      return null;
    }

    let text = entitySet.label;
    if (truncate) {
      text = truncateText(text, truncate);
    }

    return (
      <span className={c('EntitySetLabel', className)} title={entitySet.label}>
        {icon && <EntitySetIcon entitySet={entitySet} className="left-icon" />}
        <span>{text}</span>
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
  itemRenderer = (entitySet, { handleClick }) => {
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
  static Icon = EntitySetIcon;

  static Label = EntitySetLabel;

  static Link = withRouter(EntitySetLink);

  static Select = EntitySetSelect;
}

export default EntitySet;
