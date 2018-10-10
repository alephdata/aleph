import React, { Component } from 'react';

import { Collection } from 'src/components/common';
import DocumentSearch from 'src/components/Document/DocumentSearch';
import CollectionSearch from "src/components/Collection/CollectionSearch";

import './Breadcrumbs.css';

class Breadcrumbs extends Component {
  render() {
    const { collection, children, document, hasSearchBar, sourceSearch, placeholder, queryPrefix } = this.props;
    console.log(hasSearchBar)

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
        {document !== undefined && hasSearchBar && <DocumentSearch document={document} placeholder='Search'/>}
        {document === undefined && hasSearchBar && sourceSearch === undefined && <CollectionSearch collection={collection}/>}
        {sourceSearch && <div className="pt-input-group">
          <i className="pt-icon pt-icon-search"/>
          <input className="pt-input" type="search"
                 placeholder={placeholder}
                 onChange={this.props.onChangeQueryPrefix} value={queryPrefix}/>
        </div>}
      </nav>
    );
  }
}

export default Breadcrumbs;
