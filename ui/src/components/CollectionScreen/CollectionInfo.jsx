import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';

import DualPane from 'src/components/common/DualPane';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import getPath from 'src/util/getPath';


class CollectionInfo extends Component {
  render() {
    const { collection, categoryLabel } = this.props;
    return (
      <DualPane.InfoPane>
        <Breadcrumbs>
          <Link to={'/'}><Icon iconName="folder-open" /> Aleph</Link>
          <span>{categoryLabel}</span>
        </Breadcrumbs>
        <h1>
          <Link to={getPath(collection.ui)}>
            {collection.label}
          </Link>
        </h1>
        <p>{collection.summary}</p>
        Contains:
        <ul>
          {Object.entries(collection.schemata).map(([key, value]) => (
            <li key={key}>{key}: {value}</li>
          ))}
        </ul>
        <p>
          Last update: {collection.updated_at}
        </p>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const categoryLabel = state.metadata.categories[collection.category];
  return {
    categoryLabel
  };
}

export default connect(mapStateToProps)(CollectionInfo);
