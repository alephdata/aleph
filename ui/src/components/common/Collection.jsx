import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import truncateText from 'truncate';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import getCollectionLink from 'src/util/getCollectionLink';

import './Collection.scss';


class CollectionLabel extends PureComponent {
  render() {
    const {
      collection, icon = true, label = true, truncate,
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

    return (
      <span className="CollectionLabel" title={collection.label}>
        { icon && (<Icon icon={iconName} style={style} />)}
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


class CollectionLoad extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.func.isRequired,
    renderWhenLoading: PropTypes.node.isRequired,
  }

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

const mapStateToProps = (state, ownProps) => ({
  collection: selectCollection(state, ownProps.id),
});

class Collection {
  static Label = CollectionLabel;

  static Link = withRouter(CollectionLink);

  static Load = connect(mapStateToProps, { fetchCollection })(CollectionLoad);
}

export default Collection;
