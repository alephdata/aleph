import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import { withRouter } from "react-router";
import { FormattedMessage } from 'react-intl';
import c from 'classnames';

import Screen from 'src/components/Screen/Screen';
import CollectionInfo from 'src/components/Collection/CollectionInfo';
import { Collection, DualPane } from 'src/components/common';
import { fetchCollectionXrefIndex } from 'src/actions';
import { selectCollectionXrefIndex } from 'src/selectors';
import { getColor } from "src/util/colorScheme";


class CollectionScreenContext extends Component {

  render() {
    const { collection } = this.props;
    return (
      <Screen title={collection.label}>
        <DualPane>
          <DualPane.ContentPane>
            {this.props.children}
          </DualPane.ContentPane>
          <CollectionInfo collection={collection} />
        </DualPane>
      </Screen>
    );
  }
}

CollectionScreenContext = withRouter(CollectionScreenContext);
export default (CollectionScreenContext);
