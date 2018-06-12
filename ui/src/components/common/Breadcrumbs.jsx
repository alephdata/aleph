import React, { Component } from 'react';

import { Collection } from 'src/components/common';

import './Breadcrumbs.css';

class Breadcrumbs extends Component {
  render() {
    const { collection, children } = this.props;

    let collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <li key='collection'>
          <Collection.Link collection={collection} className="pt-breadcrumb" icon />
        </li>
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="pt-breadcrumbs">
          {collectionCrumbs}
          {children}
        </ul>
      </nav>
    );
  }
}

export default Breadcrumbs;
