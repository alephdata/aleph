import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedNumber } from 'react-intl';

import { fetchCollectionXrefIndex } from '../../actions/index';
import getPath from 'src/util/getPath';


class CollectionInfoXref extends React.Component {
  componentDidMount() {
    const { collection } = this.props;
    if (!this.props.index && collection && collection.id) {
      this.props.fetchCollectionXrefIndex(collection.id);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.collection.id !== nextProps.collection.id) {
      this.props.fetchCollectionXrefIndex(nextProps.collection.id);
    }
  }

  render() {
    const { index, collection } = this.props;
    if (!index) {
      return null;
    }

    const linkPath = getPath(collection.links.ui) + '/xref/';
    return (
      <div className="xrefs">
        <ul className="info-rank">
          { index.results.map((idx) => (
            <li key={idx.collection.id}>
              <span className="key">
                <Link to={`${linkPath}${idx.collection.id}`}>
                  {idx.collection.label}
                </Link>
              </span>
              <span className="value">
                <FormattedNumber value={idx.matches} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const xRefs = state.collectionXrefIndex[ownProps.collection.id];
  if (ownProps.onCollectionXRefLoad)
    ownProps.onCollectionXRefLoad(collection, xRefs)
  return {
    index: xRefs
  };
};

export default connect(mapStateToProps, {fetchCollectionXrefIndex})(CollectionInfoXref);
