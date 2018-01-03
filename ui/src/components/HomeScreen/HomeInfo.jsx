import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';

import './HomeInfo.css';

class HomeInfo extends Component {
  render() {
    return (
      <DualPane.InfoPane>
        <p>Search millions of documents and datasets, from public sources, leaks and investigations.</p>
      </DualPane.InfoPane>
    );
  }
}

export default HomeInfo;
