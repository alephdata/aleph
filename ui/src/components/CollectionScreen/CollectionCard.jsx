import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import Date from 'src/components/common/Date';
import Category from 'src/components/common/Category';
import Collection from 'src/components/common/Collection';

import './CollectionCard.css';

class CollectionCard extends Component {
  render() {
    const { collection } = this.props;
    if (!collection || !collection.id) {
      return (<span></span>)
    }
    return (
      <div className="CollectionCard pt-card pt-elevation-1">
        <h4><Collection.Link collection={collection} /></h4>
        <div className="facts">
          <div className="fact">
            <FormattedNumber value={collection.count} />{' '}
            <FormattedMessage id="collection.total.count" defaultMessage="Entries"/>
          </div>
          <div className="fact">
            <i className="fa fa-fw fa-refresh" />
            <Date value={collection.updated_at} />
          </div>
          {/*
          <div className="fact">
            <Category collection={collection} />
          </div>
          */}
        </div>
        {collection.summary && 
          (<p>{ collection.summary }</p>)
        }
        {!collection.summary && 
          (<p className="missing">
            <FormattedMessage id="collection.summary.missing" defaultMessage="This collecton has no description."/>
          </p>)
        }
      </div>
    );
  }
}

export default CollectionCard;
