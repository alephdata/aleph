import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Country, Role, Date, URL, Frequency,
} from 'components/common';

import './CollectionInfo.scss';

class CollectionInfo extends PureComponent {
  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return (
      <div className="CollectionInfo">
        { (collection.publisher || collection.publisher_url) && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.publisher" defaultMessage="Publisher" />
            </div>
            <div className="value">
              {!collection.publisher && (
                <URL value={collection.publisher_url} />
              )}
              {!collection.publisher_url && (
                <span>{collection.publisher}</span>
              )}
              {(collection.publisher && collection.publisher_url) && (
                <a href={collection.publisher_url} target="_blank" rel="noopener noreferrer">
                  {collection.publisher}
                </a>
              )}
            </div>
          </div>
        )}
        { collection.info_url && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.info_url" defaultMessage="Information URL" />
            </div>
            <div className="value">
              <URL value={collection.info_url} itemProp="identifier" />
            </div>
          </div>
        )}
        { collection.data_url && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.data_url" defaultMessage="Data URL" />
            </div>
            <div className="value">
              <URL value={collection.data_url} />
            </div>
          </div>
        )}
        { collection.creator && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.creator" defaultMessage="Manager" />
            </div>
            <div className="value">
              <Role.Link role={collection.creator} />
            </div>
          </div>
        )}
        { (collection.team && collection.team.length > 0) && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.team" defaultMessage="Accessible to" />
            </div>
            <div className="value">
              <Role.List roles={collection.team} separateItems={false} />
            </div>
          </div>
        )}
        { collection.countries && !!collection.countries.length && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.countries" defaultMessage="Country" />
            </div>
            <div className="value" itemProp="spatialCoverage">
              <Country.List codes={collection.countries} />
            </div>
          </div>
        )}
        { !collection.casefile && !!collection.frequency && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.frequency" defaultMessage="Updates" />
            </div>
            <div className="value">
              <Frequency.Label frequency={collection.frequency} />
            </div>
          </div>
        )}
        { !!collection.data_updated_at && (
          <div className="CollectionInfo__item">
            <div className="key text-muted">
              <FormattedMessage id="collection.data_updated_at" defaultMessage="Content updated" />
            </div>
            <div className="value">
              <Date value={collection.data_updated_at} />
            </div>
          </div>
        )}
        <div className="CollectionInfo__item">
          <div className="key text-muted">
            <FormattedMessage id="collection.updated_at" defaultMessage="Metadata updated" />
          </div>
          <div className="value" itemProp="dateModified">
            <Date value={collection.updated_at} />
          </div>
        </div>
      </div>
    );
  }
}

export default CollectionInfo;
