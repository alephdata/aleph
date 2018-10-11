import React, { PureComponent, Component } from 'react';

import { Collection, Entity } from 'src/components/common';
import DocumentSearch from 'src/components/Document/DocumentSearch';
import CollectionSearch from "src/components/Collection/CollectionSearch";

import './Breadcrumbs.css';

class Breadcrumbs extends Component {
  render() {
    const { collection, children, document, hasSearchBar, sourceSearch, placeholder, queryPrefix } = this.props;

    let collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
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


class CollectionBreadcrumb extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <li key={collection.id}>
        <Collection.Link collection={collection} className="pt-breadcrumb" icon truncate={30} />
      </li>
    );
  }
}


class EntityBreadcrumb extends PureComponent {
  render() {
    const { entity } = this.props;
    return (
      <li key={entity.id}>
        <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30} />
      </li>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const { text } = this.props;
    if ( !text ) {
      return null;
    }
    return (
      <li key="text">
        <span className="pt-breadcrumb pt-breadcrumb-current">{text}</span>
      </li>
    );
  }
}


Breadcrumbs.Collection = CollectionBreadcrumb;
Breadcrumbs.Entity = EntityBreadcrumb;
Breadcrumbs.Text = TextBreadcrumb;
export default Breadcrumbs;
