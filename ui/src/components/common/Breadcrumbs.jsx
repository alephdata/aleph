import React, { PureComponent, Component } from 'react';
import { Classes, ControlGroup, Divider, Icon } from '@blueprintjs/core';
import c from 'classnames';

import {
  Collection,
  Entity,
  EntitySet,
  Skeleton,
  Restricted,
} from 'components/common';

import './Breadcrumbs.scss';

class CollectionBreadcrumb extends PureComponent {
  renderSkeleton() {
    return (
      <li>
        <Skeleton.Text type="span" length={20} className={Classes.BREADCRUMB} />
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
          className={c(
            Classes.BREADCRUMB,
            active && Classes.BREADCRUMB_CURRENT
          )}
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
        {hasAncestors && (
          <li key="ancestors">
            <span className={Classes.BREADCRUMB}>
              <Icon icon="more" />
            </span>
          </li>
        )}
        {!!parent && (
          <li key={parent.id}>
            <Entity.Link
              entity={parent}
              className={Classes.BREADCRUMB}
              icon
              truncate={30}
            />
          </li>
        )}
        <li key={entity.id}>
          <Entity.Label
            entity={entity}
            className={c(Classes.BREADCRUMB, Classes.BREADCRUMB_CURRENT)}
            truncate={30}
          />
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
        <EntitySet.Label
          entitySet={entitySet}
          className={c(Classes.BREADCRUMB, Classes.BREADCRUMB_CURRENT)}
          icon={icon}
          truncate={30}
        />
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
    const className = c(
      Classes.BREADCRUMB,
      active && Classes.BREADCRUMB_CURRENT
    );
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
      <>
        {status}
        {status && search && <Divider />}
        {search}
        {search && operation && <Divider />}
        {operation}
      </>
    );
  }

  renderCenter() {
    if (!this.props.center) {
      return null;
    }

    return <div className="Breadcrumbs__center">{this.props.center}</div>;
  }

  render() {
    const { children, type } = this.props;

    return (
      <nav className={c('Breadcrumbs', type)}>
        <div className="Breadcrumbs__inner-container">
          <div className="Breadcrumbs__main">
            <ul className={Classes.BREADCRUMBS}>{children}</ul>
          </div>
          {this.renderCenter()}
          <div className="Breadcrumbs__right">{this.renderOperations()}</div>
        </div>
      </nav>
    );
  }
}
