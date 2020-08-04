import React, { PureComponent } from 'react';
import _ from 'lodash';
import { defineMessages } from 'react-intl';
import truncateText from 'truncate';
import { Button, Icon, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import c from 'classnames';
import getEntitySetLink from 'util/getEntitySetLink';

const messages = defineMessages({
  diagram: {
    id: 'diagram',
    defaultMessage: "{count, plural, one {diagram} other {diagrams}}",
  },
  timeline: {
    id: 'timeline',
    defaultMessage: "{count, plural, one {timeline} other {timelines}}",
  },
  list: {
    id: 'list',
    defaultMessage: "{count, plural, one {list} other {lists}}",
  },
});

const ICONS = {
  diagram: 'graph',
  timeline: 'timeline-events',
  list: 'list'
}

const getIcon = ({ type }) => ICONS[type] || ICONS.list;

const getTypeLabel = (intl, type, { capitalize, plural }) => {
  const label = intl.formatMessage(messages[type], { count: plural ? 2 : 1 })
  return capitalize ? _.capitalize(label) : label;
}

const EntitySetIcon = ({entitySet, className}) => (
  <Icon icon={getIcon(entitySet)} className={className} />
);

class EntitySetLabel extends PureComponent {
  render() {
    const { entitySet, icon, truncate } = this.props;
    if (!entitySet || !entitySet.id) {
      return null;
    }

    let text = entitySet.label;
    if (truncate) {
      text = truncateText(text, truncate);
    }

    return (
      <span className="EntitySetLabel" title={entitySet.label}>
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
  static getTypeLabel = getTypeLabel;

  static Icon = EntitySetIcon;

  static Label = EntitySetLabel;

  static Link = withRouter(EntitySetLink);

  static Select = EntitySetSelect;
}

export default EntitySet;
