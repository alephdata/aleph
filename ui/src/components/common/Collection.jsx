import React, { Component, PureComponent } from 'react';
import { Button, Icon, MenuItem, Popover, Spinner } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import truncateText from 'truncate';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection, fetchCollectionStatus, queryCollections } from 'actions';
import { selectCollection, selectCollectionsResult, selectCollectionStatus } from 'selectors';
import getCollectionLink from 'util/getCollectionLink';
import { Skeleton } from 'components/common';
import CollectionStatus from 'components/Collection/CollectionStatus';
import SelectWrapper from 'components/common/SelectWrapper';


import './Collection.scss';

class CollectionLabel extends PureComponent {
  render() {
    const {
      collection, icon = true, label = true, updating = false, truncate, className,
    } = this.props;

    if (!collection) {
      return null;
    }
    if (!collection.id && collection.isPending) {
      return <Skeleton.Text type="span" length={15} />;
    }

    let iconName = 'database';
    const style = {};
    if (collection.casefile) {
      iconName = 'briefcase';
    } else if (collection.secret) {
      iconName = 'lock';
    }

    let text = collection.label;
    if (truncate) {
      text = truncateText(collection.label, truncate);
    }
    let renderedIcon;
    if (updating) {
      renderedIcon = <Spinner size="16" />;
    } else if (icon) {
      renderedIcon = <Icon icon={iconName} style={style} />;
    }

    return (
      <span className={c('CollectionLabel', className)} title={collection.label}>
        { renderedIcon }
        <span>{ label && text }</span>
      </span>
    );
  }
}

class CollectionLink extends PureComponent {
  render() {
    const { collection, className } = this.props;
    const link = getCollectionLink(collection);
    const content = <Collection.Label {...this.props} />;
    if (!link) {
      return content;
    }
    return <Link to={link} className={c('CollectionLink', className)}>{content}</Link>;
  }
}

class CollectionUpdateStatus extends PureComponent {
  componentDidMount() {
    const { collection, status } = this.props;
    if (status.shouldLoad) {
      this.props.fetchCollectionStatus(collection);
    }
  }

  render() {
    const { collection, showPopover, status, LabelComponent } = this.props;
    const updating = !status.shouldLoad && status.active;
    const collectionLabel = <LabelComponent updating={updating} {...this.props} />;

    if (showPopover && updating) {
      return (
        <Popover
          lazy
          interactionKind="hover"
          autofocus={false}
          enforceFocus={false}
          popoverClassName="CollectionUpdateStatus__popover"
          target={collectionLabel}
          content={<CollectionStatus collection={collection} showCancel={false} className="bp3-callout bp3-intent-primary" />}
        />
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
  )

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  render() {
    const { buttonProps, collection, result } = this.props;
    const label = collection ? <CollectionLabel collection={collection} icon={false} /> : buttonProps.label;

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
        <Button
          fill
          text={label}
          icon="briefcase"
          alignText="left"
        />
      </SelectWrapper>
    );
  }
}

const statusMapStateToProps = (state, ownProps) => ({
  status: selectCollectionStatus(state, ownProps.collection.id),
});

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

  static Status =
    connect(statusMapStateToProps, { fetchCollectionStatus })(CollectionUpdateStatus);

  static Link = withRouter(CollectionLink);

  static Load = connect(loadMapStateToProps, { fetchCollection })(CollectionLoad);

  static Select = connect(
    selectMapStateToProps,
    { queryCollections },
  )(CollectionSelect);
}

export default Collection;
