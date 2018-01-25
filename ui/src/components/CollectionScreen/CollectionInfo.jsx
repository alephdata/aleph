import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import DualPane from 'src/components/common/DualPane';
import Category from 'src/components/common/Category';
import Language from 'src/components/common/Language';
import Country from 'src/components/common/Country';
import Schema from 'src/components/common/Schema';
import Date from 'src/components/common/Date';


class CollectionInfo extends Component {
  render() {
    const { collection, location } = this.props;

    return (
      <DualPane.InfoPane>
        <h1>
          {collection.label}
        </h1>
        <p>{collection.summary}</p>
        <table className='info-sheet'>
          <tbody>
            <tr>
              <th>
                <FormattedMessage id="collection.category" defaultMessage="Category"/>
              </th>
              <td>
                <Category collection={collection} />
              </td>
            </tr>
            { collection.languages && !!collection.languages.length && (
              <tr>
                <th>
                  <FormattedMessage id="collection.languages" defaultMessage="Language"/>
                </th>
                <td>
                  <Language.List codes={collection.languages} />
                </td>
              </tr>
            )}
            { collection.countries && !!collection.countries.length && (
              <tr>
                <th>
                  <FormattedMessage id="collection.countries" defaultMessage="Country"/>
                </th>
                <td>
                  <Country.List codes={collection.countries} />
                </td>
              </tr>
            )}
            <tr>
              <th>
                <FormattedMessage id="collection.updated_at" defaultMessage="Last updated"/>
              </th>
              <td>
                <Date value={collection.updated_at} />
              </td>
            </tr>
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
