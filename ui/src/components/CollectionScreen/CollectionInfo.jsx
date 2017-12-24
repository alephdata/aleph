import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedDate } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';


class CollectionInfo extends Component {
  render() {
    const { collection } = this.props;

    return (
      <DualPane.InfoPane>
        <h1>
          {collection.label}
        </h1>
        <p>{collection.summary}</p>
        Contains:
        <table>
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
          Last update:
          <FormattedDate value={collection.updated_at} />
        </p>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
}

export default connect(mapStateToProps)(CollectionInfo);
