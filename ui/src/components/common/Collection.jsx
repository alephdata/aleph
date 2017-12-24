import { Link } from 'react-router-dom';
import React, { Component } from 'react';

import getPath from 'src/util/getPath';


class Label extends Component {
  render() {
    const { collection, icon } = this.props;

    return (
      <span>
        { collection.label }
        { collection.secret && (<i className='fa fa-fw fa-lock' />) }
      </span>
    );
  }
}

class CollectionLink extends Component {
  render() {
    const { collection, icon, className } = this.props;
    
    return (
      <Link to={getPath(collection.links.ui)} className={className}>
        <Label collection={collection} icon={icon} />
      </Link>
    );
  }
}

class Collection {
  static Label = Label;
  static Link = CollectionLink;
}

export default Collection;
