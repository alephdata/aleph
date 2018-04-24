import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import c from 'classnames';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';

class CollectionLabel extends Component {
  render() {
    const { collection, icon = true } = this.props;

    if (collection.id === undefined) {
      return null;
    }

    return (
      <React.Fragment>
        { collection.secret && icon && (<i className='fa fa-fw fa-lock' />) }
        { collection.label }
      </React.Fragment>
    );
  }
}

class CollectionLink extends Component {
  render() {
    const { collection, icon = true, className, preview } = this.props;

    if (collection.id === undefined) {
      return null;
    }

    if (preview === true) {
      // Displays in preview sidebar
      return (
        <a href={`#preview:id=${collection.id}&preview:type=collection`}
           className={c('CollectionLink', className)}>
          <Collection.Label collection={collection} icon={icon} />
        </a>
      );
    } else {
      const url = `/search?filter:collection_id=${collection.id}#preview:id=${collection.id}&preview:type=collection`;
      return (
        <Link to={url} className={c('CollectionLink', className)}>
          <Collection.Label collection={collection} icon={icon} iconOpen={true} />
        </Link>
      );
    }
  }
}

class CollectionLoad extends Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { id, collection } = this.props;
    if (collection.id === undefined && !collection.isLoading) {
      this.props.fetchCollection({ id });
    }
  }

  render() {
    const { collection, children, renderWhenLoading } = this.props;
    if (
      (collection.id === undefined || collection.isLoading)
      && renderWhenLoading !== undefined
    ) {
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
