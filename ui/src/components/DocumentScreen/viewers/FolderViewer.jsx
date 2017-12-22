import React, { Component } from 'react';
import { connect } from 'react-redux';
import WayPoint from 'react-waypoint';
import { Spinner } from '@blueprintjs/core';

import SearchContext from 'src/components/SearchScreen/SearchContext';


class FolderViewer extends Component {

  render() {
    const { document } = this.props;
    return (
      <SearchContext collection={document.collection} parent={document} />
    );
  }
}

export default FolderViewer;
