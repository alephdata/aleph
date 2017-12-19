import { Link } from 'react-router-dom';
import React, { Component } from 'react';

import getPath from 'src/util/getPath';


class Label extends Component {
  render() {
    const { collection, icon } = this.props;
    let iconClass = collection.secret ? 'fa fa-fw fa-lock' : 'fa fa-fw fa-globe';

    return (
      <span>
        { icon && (<i className={ iconClass } />) }
        { collection.label }
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
