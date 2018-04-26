import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedNumber } from 'react-intl';

import getPath from 'src/util/getPath';

class CollectionInfoXref extends React.Component {

  render() {
    const { xrefIndex, collection } = this.props;
    if (xrefIndex.results === undefined) {
      return null;
    }

    const linkPath = getPath(collection.links.ui) + '/xref/';
    return (
      <div className="xrefs">
        <ul className="info-rank">
          { xrefIndex.results.map((idx) => (
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

export default CollectionInfoXref;
