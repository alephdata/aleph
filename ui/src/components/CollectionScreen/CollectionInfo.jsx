import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';
import Date from 'src/components/common/Date';


class CollectionInfo extends Component {
  render() {
    const { collection } = this.props;

    return (
      <DualPane.InfoPane>
        <h1>
          {collection.label}
        </h1>
        <p>{collection.summary}</p>
        <p>
          Last update:
          <Date value={collection.updated_at} />
        </p>
        
        <h3>
          <FormattedMessage id="collection.contents" defaultMessage="Contents"/>
        </h3>
        <table>
          <tbody>
            {Object.entries(collection.schemata).map(([key, value]) => (
              <tr key={key}>
                <th>
                  <Schema.Icon schema={key} />
                  <Schema.Name schema={key} plural />
                </th>
                <td className="numeric">
                  <FormattedNumber value={value} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
}

export default connect(mapStateToProps)(CollectionInfo);
