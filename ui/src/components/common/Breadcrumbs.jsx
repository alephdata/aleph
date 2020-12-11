import React, { PureComponent, Component } from 'react';
import { ControlGroup, Divider, Icon } from '@blueprintjs/core';
import c from 'classnames';

import { Category, Collection, Entity, EntitySet, Skeleton, Restricted } from 'components/common';

import './Breadcrumbs.scss';


class CollectionBreadcrumb extends PureComponent {
  renderSkeleton() {
    const { showCategory } = this.props;

    return (
      <>
        {showCategory && (
          <li>
            <Skeleton.Text type="span" length={20} className="bp3-breadcrumb" />
          </li>
        )}
        <li>
          <Skeleton.Text type="span" length={20} className="bp3-breadcrumb" />
        </li>
      </>
    );
  }

  render() {
    const { collection, active, showCategory } = this.props;

    const isPending = collection.isPending && !collection.label;
    if (isPending) {
      return this.renderSkeleton();
    }

    return (
      <>
        {showCategory && (
          <li key={collection.category}>
            <Category.Link category={collection.category} className="bp3-breadcrumb" icon />
          </li>
        )}
        <li key={collection.id}>
          <Collection.Status
            collection={collection}
            showPopover
            className={c('bp3-breadcrumb', { 'bp3-breadcrumb-current': active })}
            icon
            truncate={30}
            LabelComponent={active ? Collection.Label : Collection.Link}
          />
          <Restricted collection={collection} />
        </li>
      </>
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
          <Entity.Label entity={entity} className="bp3-breadcrumb bp3-breadcrumb-current" icon truncate={30} />
        </li>
      </>
    );
  }
}

class EntitySetBreadcrumb extends PureComponent {
  render() {
    const { entitySet } = this.props;
    return (
      <li key={entitySet.id}>
        <EntitySet.Label entitySet={entitySet} className="bp3-breadcrumb bp3-breadcrumb-current" icon truncate={30} />
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
    const items = [status, search, operation];

    return (
      <ControlGroup>
        {items.map((item, i) => item && <React.Fragment key={i}>{item}<Divider /></React.Fragment>)}
      </ControlGroup>
    );
  }

  render() {
    const { collection, children } = this.props;

    const collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <div className="Breadcrumbs__inner-container">
          <div className="Breadcrumbs__main">
            <ul className="bp3-breadcrumbs">
              {collectionCrumbs}
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
