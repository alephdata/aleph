import React, { Component, PureComponent } from 'react';
import { Button, Icon, MenuItem, Spinner } from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';
import { Link } from 'react-router-dom';
import truncateText from 'truncate';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection, queryCollections } from 'actions';
import { selectCollection, selectCollectionsResult } from 'selectors';
import { Skeleton, SelectWrapper } from 'components/common';
import CollectionStatus from 'components/Collection/CollectionStatus';
import getCollectionLink from 'util/getCollectionLink';

import './Collection.scss';

class CollectionLabel extends PureComponent {
  getIcon(collection) {
    if (collection.casefile) {
      return 'briefcase';
    } else if (collection.secret) {
      return 'lock';
    }
    return 'database';
  }

  render() {
    const {
      collection,
      icon = true,
      label = true,
      updating = false,
      truncate,
      className,
    } = this.props;

    if (!collection?.id) {
      if (collection?.isPending) {
        return <Skeleton.Text type="span" length={15} />;
      }
      return null;
    }

    let text = collection.label;
    if (truncate) {
      text = truncateText(collection.label, truncate);
    }
    const renderedIcon = updating ? (
      <Spinner size="16" />
    ) : (
      <Icon icon={this.getIcon(collection)} />
    );
    return (
      <span
        className={c('CollectionLabel', className)}
        title={collection.label}
      >
        {icon && renderedIcon}
        <span>{label && text}</span>
      </span>
    );
  }
}

class CollectionLink extends PureComponent {
  render() {
    const { collection, className } = this.props;
    const content = <Collection.Label {...this.props} />;
    const link = getCollectionLink({ collection });
    if (!link) {
      return content;
    }
    return (
      <Link to={link} className={c('CollectionLink', className)}>
        {content}
      </Link>
    );
  }
}

class CollectionUpdateStatus extends PureComponent {
  render() {
    const { collection, LabelComponent } = this.props;
    const updating = !!collection?.status?.active;
    const collectionLabel = (
      <LabelComponent updating={updating} {...this.props} />
    );

    if (updating) {
      return (
        <Popover
          lazy
          interactionKind="hover"
          autoFocus={false}
          enforceFocus={false}
          popoverClassName="CollectionUpdateStatus__popover"
          content={
            <CollectionStatus
              collection={collection}
              showCancel={false}
              className="bp3-callout bp3-intent-primary"
            />
          }
        >
          {collectionLabel}
        </Popover>
      );
    }
    return collectionLabel;
  }
}

class CollectionLoad extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { id, collection } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id });
    }
  }

  render() {
    const { collection, children, renderWhenLoading } = this.props;
    if (collection.isPending && renderWhenLoading !== undefined) {
      return renderWhenLoading;
    }
    return children(collection);
  }
}

class CollectionSelect extends Component {
  constructor(props) {
    super(props);
    this.renderCollection = this.renderCollection.bind(this);
    this.onSelectCollection = this.onSelectCollection.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onSelectCollection(collection, event) {
    event.stopPropagation();
    this.props.onSelect(collection);
  }

  renderCollection = (collection, { handleClick }) => (
    <MenuItem
      key={collection.id}
      onClick={handleClick}
      text={<CollectionLabel collection={collection} icon label />}
    />
  );

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  render() {
    const { buttonProps, collection, result } = this.props;
    const label = collection ? (
      <CollectionLabel collection={collection} icon={false} />
    ) : (
      buttonProps.label
    );

    return (
      <SelectWrapper
        itemRenderer={this.renderCollection}
        items={result.results}
        onItemSelect={this.onSelectCollection}
        popoverProps={{
          minimal: true,
          fill: true,
        }}
        inputProps={{
          fill: true,
        }}
        filterable={false}
        resetOnClose
        resetOnSelect
      >
        <Button fill text={label} icon="briefcase" alignText="left" />
      </SelectWrapper>
    );
  }
}

const loadMapStateToProps = (state, ownProps) => ({
  collection: selectCollection(state, ownProps.id),
});

const selectMapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  return {
    query,
    result: selectCollectionsResult(state, query),
  };
};

class Collection {
  static Label = CollectionLabel;

  static Status = CollectionUpdateStatus;

  static Link = CollectionLink;

  static Load = connect(loadMapStateToProps, { fetchCollection })(
    CollectionLoad
  );

  static Select = connect(selectMapStateToProps, { queryCollections })(
    CollectionSelect
  );
}

export default Collection;
