import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import { FormattedNumber, FormattedDate } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';
import Category from 'src/components/CollectionScreen/Category';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import getPath from 'src/util/getPath';


class CollectionInfo extends Component {
  render() {
    const { collection } = this.props;
    return (
      <DualPane.InfoPane>
        <Breadcrumbs>
          <Link to={'/'}>
            <Icon iconName="folder-open" /> Aleph
          </Link>
          <Category collection={ collection } />
        </Breadcrumbs>
        <h1>
          <Link to={getPath(collection.links.ui)}>
            {collection.label}
          </Link>
        </h1>
        <p>{collection.summary}</p>
        Contains:
        <table className="pt-table pt-condensed">
          <tbody>
            {Object.entries(collection.schemata).map(([key, value]) => (
              <tr key={key}>
                <th className="tiny"><Schema.Icon schema={key} /></th>
                <th><Schema.Name schema={key} plural /></th>
                <td className="numeric">
                  <FormattedNumber value={value} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul>
          
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
  return {};
}

export default connect(mapStateToProps)(CollectionInfo);
