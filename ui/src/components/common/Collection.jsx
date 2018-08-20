import React, { Component } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { Icon } from '@blueprintjs/core';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import getCollectionLink from 'src/util/getCollectionLink';
import { getColor } from 'src/util/colorScheme';

import './Collection.css';


class CollectionLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const { collection = {} } = this.props;
    const { collection: nextCollection = {} } = nextProps;
    return collection.id !== nextCollection.id;
  }

  render() {
    const { collection, icon = true, label = true } = this.props;
    if (collection === undefined || collection.id === undefined) {
      return null;
    }

    let iconName = "database", style = {};
    if (collection.casefile) {
      iconName = "briefcase";
      style = {color: getColor(collection.id)};
    } else if (collection.secret) {
      iconName = "lock";
    }

    return (
      <span className="CollectionLabel" title={collection.label}>
        { icon && (<Icon icon={iconName} style={style} />)}
        <span> { label && collection.label } </span>
      </span>
    );
  }
}


class CollectionLink extends Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const { collection, history, location, preview } = this.props;
    const previewType = 'collection';
    event.preventDefault();

    if (preview === true) {
      const parsedHash = queryString.parse(location.hash);
      if (parsedHash['preview:id'] === collection.id && parsedHash['preview:type'] === previewType) {
        parsedHash['preview:id'] = undefined;
        parsedHash['preview:type'] = undefined;  
      } else {
        parsedHash['preview:id'] = collection.id;
        parsedHash['preview:type'] = previewType;
      }
      history.replace({
        pathname: location.pathname,
        search: location.search,
        hash: queryString.stringify(parsedHash),
      });
    } else {
      history.push(getCollectionLink(collection));
    }
  }

  render() {
    const { collection, icon = true, className } = this.props;
    if (collection === undefined || collection.links === undefined) {
      return <Collection.Label collection={collection} icon={icon} />;
    }
    return (<a className={c('CollectionLink', className)} onClick={this.onClick}>
      <Collection.Label collection={collection} icon={icon} />
    </a>);
  }
}

CollectionLink = withRouter(CollectionLink);


class CollectionLoad extends Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
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
    } else {
      return children(collection);
    }
  }
}


const mapStateToProps = (state, ownProps) => ({
  collection: selectCollection(state, ownProps.id),
});

CollectionLoad = connect(mapStateToProps, { fetchCollection })(CollectionLoad);
CollectionLoad.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  renderWhenLoading: PropTypes.node,
};

class Collection {
  static Label = CollectionLabel;
  static Link = CollectionLink;
  static Load = CollectionLoad;
}

export default Collection;
