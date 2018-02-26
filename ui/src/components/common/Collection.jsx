import { Link } from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import getPath from 'src/util/getPath';
import { fetchCollection } from 'src/actions';


class Label extends PureComponent {
  render() {
    const { collection, icon = true } = this.props;

    return (
      <span>
        { collection.secret && icon && (<i className='fa fa-fw fa-lock' />) }
        { collection.label }
      </span>
    );
  }
}

class CollectionLink extends Component {
  render() {
    const { children, collection, icon = true, className } = this.props;

    if (!collection || !collection.links) {
      return null;
    }
    
    return (
      <Link to={getPath(collection.links.ui)} className={className}>
        {children || <Label collection={collection} icon={icon} />}
      </Link>
    );
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
    if (collection === undefined) {
      this.props.fetchCollection({ id });
    }
  }

  render() {
    const { collection, children, renderWhenLoading } = this.props;
    if (
      (collection === undefined || collection.isFetching)
      && renderWhenLoading !== undefined
    ) {
      return renderWhenLoading;
    } else {
      return children(collection);
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  collection: state.collections[ownProps.id],
});
CollectionLoad = connect(mapStateToProps, { fetchCollection })(CollectionLoad);

CollectionLoad.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  renderWhenLoading: PropTypes.node,
}

class Collection {
  static Label = Label;
  static Link = CollectionLink;
  static Load = CollectionLoad;
}

export default Collection;
