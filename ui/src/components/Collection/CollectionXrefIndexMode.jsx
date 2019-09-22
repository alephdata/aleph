import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import { Collection } from 'src/components/common';
import getCollectionLink from 'src/util/getCollectionLink';
import { selectCollectionXrefIndex } from 'src/selectors';

import './CollectionXrefIndexMode.scss';


const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    xrefIndex: selectCollectionXrefIndex(state, collection.id),
  };
};


export class CollectionXrefIndexMode extends React.PureComponent {
  render() {
    const { collection, xrefIndex } = this.props;
    if (xrefIndex.results === undefined || xrefIndex.total === undefined) {
      return null;
    }

    const linkPath = `${getCollectionLink(collection)}/xref/`;
    const exportPath = collection.links.xref_export;
    return (
      <section className="CollectionXrefTable">
        {xrefIndex.total && (
          <a href={exportPath} download className="bp3-button">
            <Icon icon="download" />
            <FormattedMessage
              id="xref.download"
              defaultMessage="Download matches"
            />
          </a>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th className="entity">
                <span className="value">
                  <FormattedMessage
                    id="xref.collection"
                    defaultMessage="Cross-referenced dataset"
                  />
                </span>
              </th>
              <th className="numeric">
                <span className="value">
                  <FormattedMessage
                    id="xref.matches"
                    defaultMessage="Matches"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {xrefIndex.results.map(xref => (
              <tr key={xref.collection.id}>
                <td className="entity">
                  <Link to={`${linkPath}${xref.collection.id}`}>
                    <Collection.Label collection={xref.collection} />
                  </Link>
                </td>
                <td className="numeric">
                  <FormattedNumber value={xref.matches} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionXrefIndexMode);
