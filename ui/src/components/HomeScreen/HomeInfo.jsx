import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';

import DualPane from 'src/components/common/DualPane';
import Breadcrumbs from 'src/components/common/Breadcrumbs';

import './HomeInfo.css';

class HomeInfo extends Component {
  render() {
    return (
      <DualPane.InfoPane>
        <Breadcrumbs root>
          <Link to={'/'}><Icon iconName="folder-open" /></Link>
        </Breadcrumbs>
        <h1>
          <Link to={'/'}>
            Aleph
          </Link>
        </h1>
        <p className="tagline"><em>93,801,670</em><br />leads for your investigations</p>
        <p>Search millions of documents and datasets, from public sources, leaks and investigations.</p>
      </DualPane.InfoPane>
    );
  }
}

export default HomeInfo;
