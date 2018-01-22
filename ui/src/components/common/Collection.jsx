import { Link } from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';

import getPath from 'src/util/getPath';
import { fetchCollection } from 'src/actions';


class Label extends Component {
  render() {
    const { collection, icon = true } = this.props;

    return (
      <span>
        { collection.secret && (<i className='fa fa-fw fa-lock' />) }
        { collection.label }
      </span>
    );
  }
}

class CollectionLink extends Component {
  render() {
    const { collection, icon = true, className } = this.props;
    
    return (
      <Link to={getPath(collection.links.ui)} className={className}>
        <Label collection={collection} icon={icon} />
      </Link>
    );
  }
}

class LabelById extends PureComponent {
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
    const { collection, id } = this.props;
    if (collection === undefined || collection.isFetching) {
      return (
        <code>{id}</code>
      );
    } else {
     return (
       <Collection.Label collection={collection} />
     );
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  collection: state.collections[ownProps.id],
});
LabelById = connect(mapStateToProps, { fetchCollection })(LabelById);


class Collection {
  static Label = Label;
  static Link = CollectionLink;
  static LabelById = LabelById;
}

export default Collection;
