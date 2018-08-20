import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import getPath from 'src/util/getPath';
import { fetchCollectionXrefIndex } from "src/actions";
import { selectCollectionXrefIndex } from "src/selectors";
import { selectCollection } from "../../selectors";

class CollectionInfoXref extends React.Component {
  constructor(props) {
    super(props);
  }

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
    const { xrefIndex, collection } = this.props;
    if (xrefIndex.results === undefined) {
      return null;
    }

    const linkPath = getPath(collection.links.ui) + '/xref/';

    return (
      <section className="CollectionInfoXref">
        <table className="data-table">
          <thead>
          <tr>
            <th className='entity'>
              <span className="value">
                 <FormattedMessage id="xref.collection"
                                   defaultMessage="Collection" />
              </span>
            </th>
            <th>
              <span className="value">
                <FormattedMessage id="xref.cross.matches"
                                  defaultMessage="Cross-matches" />
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
  const { collectionId } = ownProps.match.params;
  const collection =  selectCollection(state, collectionId);
  const xrefIndex = selectCollectionXrefIndex(state, collectionId);
  return { xrefIndex, collection };
};

CollectionInfoXref = connect(mapStateToProps, { fetchCollectionXrefIndex })(CollectionInfoXref);
CollectionInfoXref = withRouter(CollectionInfoXref);
export default CollectionInfoXref;
