import React, { PureComponent, Component } from 'react';
import { Icon } from '@blueprintjs/core';
import c from 'classnames';
import { Category, Collection, Entity } from 'src/components/common';

import './Breadcrumbs.scss';


class CollectionBreadcrumb extends PureComponent {
  render() {
    const { collection, showCategory } = this.props;

    return (
      <React.Fragment>
        {showCategory && (
          <li key={collection.category}>
            <Category.Link collection={collection} className="bp3-breadcrumb" icon />
          </li>
        )}
        <li key={collection.id}>
          <Collection.Link collection={collection} className={c('bp3-breadcrumb', { 'bp3-breadcrumb-current': showCategory })} icon truncate={30} />
        </li>
      </React.Fragment>
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
      <React.Fragment>
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
          <Entity.Link entity={entity} className="bp3-breadcrumb bp3-breadcrumb-current" icon truncate={30} />
        </li>
      </React.Fragment>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const { text } = this.props;
    if (!text) {
      return null;
    }
    return (
      <li key="text">
        <span className="bp3-breadcrumb bp3-breadcrumb-current">{text}</span>
      </li>
    );
  }
}

export default class Breadcrumbs extends Component {
  static Collection = CollectionBreadcrumb;

  static Entity = EntityBreadcrumb;

  static Text = TextBreadcrumb;

  render() {
    const { collection, children, operation } = this.props;

    const collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="bp3-breadcrumbs">
          {collectionCrumbs}
          {children}
        </ul>
        {operation}
      </nav>
    );
  }
}
