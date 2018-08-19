import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { Category, Language, Country, Role, Date, Collection } from 'src/components/common';

class CollectionOverview extends Component {
  render() {
    const { collection, hasHeader = false } = this.props;
    
    // If collection data it hasn't loaded yet don't attempt to draw anything
    if (!collection)
      return null;

    return (
      <React.Fragment>
        {hasHeader && (
          <h4>
            <Collection.Link collection={collection} />
          </h4>
        )}
        <p>{collection.summary}</p>
        <ul className='info-sheet'>
          { !collection.casefile && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.category" defaultMessage="Category"/>
              </span>
              <span className="value">
                <Category collection={collection} />
              </span>
            </li>
          )}
          { collection.creator && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.creator" defaultMessage="Manager"/>
              </span>
              <span className="value">
                <Role.Label role={collection.creator} />
              </span>
            </li>
          )}
          { collection.languages && !!collection.languages.length && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.languages" defaultMessage="Language"/>
              </span>
              <span className="value">
                <Language.List codes={collection.languages} />
              </span>
            </li>
          )}
          { collection.countries && !!collection.countries.length && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.countries" defaultMessage="Country"/>
              </span>
              <span className="value">
                <Country.List codes={collection.countries} />
              </span>
            </li>
          )}
          <li>
            <span className="key">
              <FormattedMessage id="collection.updated_at" defaultMessage="Last updated"/>
            </span>
            <span className="value">
              <Date value={collection.updated_at} />
            </span>
          </li>
        </ul>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

CollectionOverview = connect(mapStateToProps)(CollectionOverview);

export default CollectionOverview;
