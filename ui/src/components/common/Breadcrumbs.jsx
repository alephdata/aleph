import React, { PureComponent, Component } from 'react';
import { Icon, Intent, Spinner, Tag } from '@blueprintjs/core';
import c from 'classnames';
import { Category, Collection, Entity } from 'src/components/common';

import './Breadcrumbs.scss';


class CollectionBreadcrumb extends PureComponent {
  render() {
    const { collection, active, showCategory } = this.props;

    return (
      <>
        {showCategory && (
          <li key={collection.category}>
            <Category.Link collection={collection} className="bp3-breadcrumb" icon />
          </li>
        )}
        <li key={collection.id}>
          <Collection.Status collection={collection} showPopover className={c('bp3-breadcrumb', { 'bp3-breadcrumb-current': active })} icon truncate={30} />
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
          <Entity.Link entity={entity} className="bp3-breadcrumb bp3-breadcrumb-current" icon truncate={30} />
        </li>
      </>
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

  static Text = TextBreadcrumb;

  renderStatus() {
    const { text, intent } = this.props.status;
    let icon;

    if (intent === Intent.PRIMARY) {
      icon = <Spinner size="16" intent={intent} />;
    } else if (intent === Intent.SUCCESS) {
      icon = 'tick';
    } else {
      icon = 'error';
    }

    return (
      <Tag large minimal intent={intent} className="Breadcrumbs__status" icon={icon}>
        {text}
      </Tag>
    );
  }

  render() {
    const { collection, children, operation, status } = this.props;

    const collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <div className="Breadcrumbs__main">
          <ul className="bp3-breadcrumbs">
            {collectionCrumbs}
            {children}
          </ul>
        </div>
        <div className="Breadcrumbs__right">
          {status && this.renderStatus()}
          {operation}
        </div>
      </nav>
    );
  }
}
