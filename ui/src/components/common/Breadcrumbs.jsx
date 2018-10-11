import React, { Component } from 'react';

import { Collection } from 'src/components/common';
import DocumentSearch from 'src/components/Document/DocumentSearch';
import CollectionSearch from "src/components/Collection/CollectionSearch";

import './Breadcrumbs.css';

class Breadcrumbs extends Component {
  render() {
    const { collection, children, document } = this.props;

    let collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <li key='collection'>
          <Collection.Link collection={collection} className="pt-breadcrumb" icon truncate={30} />
        </li>
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="pt-breadcrumbs">
          {collectionCrumbs}
          {children}
        </ul>
        {document !== undefined && <DocumentSearch document={document} placeholder='Search'/>}
        {document === undefined && <CollectionSearch collection={collection}/>}
      </nav>
    );
  }
}

export default Breadcrumbs;
