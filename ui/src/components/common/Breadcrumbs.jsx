import React, { PureComponent, Component } from 'react';
import { ControlGroup, Divider, Icon } from '@blueprintjs/core';
import c from 'classnames';

import { Collection, Entity, EntitySet, Skeleton, Restricted } from 'components/common';

import './Breadcrumbs.scss';


class CollectionBreadcrumb extends PureComponent {
  renderSkeleton() {
    return (
      <li>
        <Skeleton.Text type="span" length={20} className="bp3-breadcrumb" />
      </li>
    );
  }

  render() {
    const { collection, active } = this.props;
    if (collection?.id === undefined) {
      return this.renderSkeleton();
    }

    return (
      <li key={collection.id}>
        <Collection.Status
          collection={collection}
          className={c('bp3-breadcrumb', { 'bp3-breadcrumb-current': active })}
          icon
          truncate={75}
          LabelComponent={Collection.Link}
        />
        <Restricted collection={collection} />
      </li>
    );
  }
}

class EntityBreadcrumb extends PureComponent {
  render() {
    const { entity } = this.props;
    const parent = entity.getFirst('parent');
    const ancestors = entity.getProperty('ancestors');
    const hasAncestors = ancestors.length > 1;

    return (
      <>
        { hasAncestors && (
          <li key="ancestors">
            <span className="bp3-breadcrumb">
              <Icon icon="more" />
            </span>
          </li>
        )}
        { !!parent && (
          <li key={parent.id}>
            <Entity.Link entity={parent} className="bp3-breadcrumb" icon truncate={30} />
          </li>
        )}
        <li key={entity.id}>
          <Entity.Label entity={entity} className="bp3-breadcrumb bp3-breadcrumb-current" truncate={30} />
        </li>
      </>
    );
  }
}

class EntitySetBreadcrumb extends PureComponent {
  render() {
    const { entitySet, icon } = this.props;
    return (
      <li key={entitySet.id}>
        <EntitySet.Label entitySet={entitySet} className="bp3-breadcrumb bp3-breadcrumb-current" icon={icon} truncate={30} />
      </li>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const { children, icon, active, key } = this.props;
    if (!children) {
      return null;
    }
    const className = c('bp3-breadcrumb', { 'bp3-breadcrumb-current': active });
    return (
      <li key={key || 'text'}>
        <span className={className}>
          {icon && <Icon icon={icon} />}
          {children}
        </span>
      </li>
    );
  }
}

export default class Breadcrumbs extends Component {
  static Collection = CollectionBreadcrumb;

  static Entity = EntityBreadcrumb;

  static EntitySet = EntitySetBreadcrumb;

  static Text = TextBreadcrumb;

  renderOperations() {
    const { operation, search, status } = this.props;
    return (
      <ControlGroup>
        {status}
        {(status && search) && <Divider />}
        {search}
        {(search && operation) && <Divider />}
        {operation}
      </ControlGroup>
    );
  }

  render() {
    const { children, type } = this.props;

    return (
      <nav className={c("Breadcrumbs", type)}>
        <div className="Breadcrumbs__inner-container">
          <div className="Breadcrumbs__main">
            <ul className="bp3-breadcrumbs">
              {children}
            </ul>
          </div>
          <div className="Breadcrumbs__right">
            {this.renderOperations()}
          </div>
        </div>
      </nav>
    );
  }
}
