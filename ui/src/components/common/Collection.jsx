import React, { Component, PureComponent } from 'react';
import { Icon, Popover, Spinner } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import truncateText from 'truncate';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection, fetchCollectionStatus } from 'src/actions';
import { selectCollection, selectCollectionStatus } from 'src/selectors';
import getCollectionLink from 'src/util/getCollectionLink';
import CollectionStatus from 'src/components/Collection/CollectionStatus';


import './Collection.scss';


class CollectionLabel extends PureComponent {
  render() {
    const {
      collection, icon = true, label = true, updating = false, truncate,
    } = this.props;
    if (!collection || !collection.id) {
      return null;
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
      <span className="CollectionLabel" title={collection.label}>
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
    this.props.fetchCollectionStatus(this.props.collection);
  }

  render() {
    const { collection, showPopover, status } = this.props;
    const updating = !status.shouldLoad && (status.pending || status.running);

    const collectionLink = (
      <CollectionLink
        updating={updating}
        {...this.props}
      />
    );

    if (showPopover && updating) {
      return (
        <Popover
          lazy
          interactionKind="hover"
          autofocus={false}
          enforceFocus={false}
          popoverClassName="CollectionUpdateStatus__popover"
          target={collectionLink}
          content={<CollectionStatus collection={collection} showCancel={false} />}
        />
      );
    }

    return collectionLink;
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
    if (collection.isLoading && renderWhenLoading !== undefined) {
      return renderWhenLoading;
    }
    return children(collection);
  }
}

const statusMapStateToProps = (state, ownProps) => ({
  status: selectCollectionStatus(state, ownProps.collection.id),
});

const loadMapStateToProps = (state, ownProps) => ({
  collection: selectCollection(state, ownProps.id),
});

class Collection {
  static Label = CollectionLabel;

  static Status =
    connect(statusMapStateToProps, { fetchCollectionStatus })(CollectionUpdateStatus);

  static Link = withRouter(CollectionLink);

  static Load = connect(loadMapStateToProps, { fetchCollection })(CollectionLoad);
}

export default Collection;
