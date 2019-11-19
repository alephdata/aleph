import React, { PureComponent, Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Icon, Tooltip } from '@blueprintjs/core';
import c from 'classnames';
import { Category, Collection, Entity, Numeric } from 'src/components/common';

import { fetchCollectionStatus } from 'src/actions';
import { selectCollectionStatus } from 'src/selectors';

import './Breadcrumbs.scss';

const messages = defineMessages({
  updating: {
    id: 'collection.status.progress',
    defaultMessage: 'Update in progress ({percent}%)',
  },
});

class CollectionBreadcrumb extends PureComponent {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  fetchStatus() {
    const { collection } = this.props;
    this.props.fetchCollectionStatus(collection)
      .finally(() => {
        const { status } = this.props;
        const duration = status.pending === 0 ? 6000 : 2000;
        this.timeout = setTimeout(this.fetchStatus, duration);
      });
  }

  render() {
    const { active, collection, intl, showCategory, status } = this.props;
    const pending = status.pending || 0;
    const running = status.running || 0;
    const finished = status.finished || 0;
    const inProcess = pending + running;
    const total = inProcess + finished;
    const progress = finished / total;
    const percent = <Numeric num={Math.round(progress * 100)} />;
    const updating = !status.shouldLoad && inProcess;

    const collectionLink = (
      <Collection.Link
        collection={collection}
        className={c('bp3-breadcrumb', { 'bp3-breadcrumb-current': active })}
        icon
        truncate={30}
        updating={updating}
      />
    );

    return (
      <>
        {showCategory && (
          <li key={collection.category}>
            <Category.Link collection={collection} className="bp3-breadcrumb" icon />
          </li>
        )}
        <li key={collection.id}>
          {updating && (
            <Tooltip content={intl.formatMessage(messages.updating, { percent })}>
              {collectionLink}
            </Tooltip>
          )}
          {!updating && collectionLink}
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

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return { status: selectCollectionStatus(state, collection.id) };
};

export default class Breadcrumbs extends Component {
  static Collection = compose(
    connect(mapStateToProps, { fetchCollectionStatus }),
    injectIntl,
  )(CollectionBreadcrumb);

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
