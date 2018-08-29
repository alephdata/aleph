import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import getPath from 'src/util/getPath';
import { fetchCollectionXrefIndex } from "src/actions";
import { selectCollectionXrefIndex } from "src/selectors";


class CollectionXrefIndexMode extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collection, xrefIndex } = this.props;
    if (collection.id !== undefined && xrefIndex.results === undefined && !xrefIndex.isLoading) {
      this.props.fetchCollectionXrefIndex(collection);
    }
  }

  render() {
    const { collection, xrefIndex } = this.props;
    if (xrefIndex.results === undefined) {
      return null;
    }

    const linkPath = getPath(collection.links.ui) + '/xref/';

    return (
      <section className="CollectionXrefTable">
        <table className="data-table">
          <thead>
          <tr>
            <th className='entity'>
              <span className="value">
                 <FormattedMessage id="xref.collection" defaultMessage="Collection" />
              </span>
            </th>
            <th>
              <span className="value">
                <FormattedMessage id="xref.matches" defaultMessage="Matches" />
              </span>
            </th>
          </tr>
          </thead>
          <tbody>
          {xrefIndex.results.map((idx) => (
            <tr key={idx.collection.id}>
              <td key={idx.collection.id} className='entity'>
                <a href={`${linkPath}${idx.collection.id}`}>
                  {idx.collection.label}
                </a>
              </td>
              <td key={idx.collection.id}>
                <FormattedNumber value={idx.matches} />
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const xrefIndex = selectCollectionXrefIndex(state, collection.id);
  return { xrefIndex };
};

CollectionXrefIndexMode = connect(mapStateToProps, { fetchCollectionXrefIndex })(CollectionXrefIndexMode);
CollectionXrefIndexMode = withRouter(CollectionXrefIndexMode);
export default CollectionXrefIndexMode  ;
