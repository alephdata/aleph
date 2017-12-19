import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';

import './HomeInfo.css';

class HomeInfo extends Component {
  render() {
    return (
      <Screen>
        <Breadcrumbs />
        <DualPane.InfoPane>
          <h1>
            <Link to={'/'}>
              Aleph
            </Link>
          </h1>
          <p className="tagline"><em>93,801,670</em><br />leads for your investigations</p>
          <p>Search millions of documents and datasets, from public sources, leaks and investigations.</p>
        </DualPane.InfoPane>
      </Screen>
    );
  }
}

export default HomeInfo;
