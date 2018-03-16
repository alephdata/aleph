import React from 'react';
import { Link } from 'react-router-dom';
import c from 'classnames';

import getPath from 'src/util/getPath';

class CollectionLink extends React.Component {
  render() {
    const { collection, className } = this.props;
    
    if (!collection || !collection.links) {
      return <span className={c('CollectionLink', className)}>{collection.label}</span>;
    }

    return (
      <Link to={getPath(collection.links.ui)} className={c('CollectionLink', className)}>
        {collection.label}
      </Link>
    );
  }
}

class Collection {
  static Link = CollectionLink;
}

export default Collection;
