import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Collection, Country, Role, Date, URL,
} from 'src/components/common';

import ClipboardInput from 'src/components/common/ClipboardInput';

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
            <span className="key text-muted">
              <FormattedMessage id="collection.publisher" defaultMessage="Publisher" />
            </span>
            <span className="value">
              { !collection.publisher && (
                <URL value={collection.publisher_url} />
              )}
              { !collection.publisher_url && (
                <span>{collection.publisher}</span>
              )}
              { (collection.publisher && collection.publisher_url) && (
                <a href={collection.publisher_url} target="_blank" rel="noopener noreferrer">
                  {collection.publisher}
                </a>
              )}
            </span>
          </div>
        )}
        { collection.info_url && (
          <div className="CollectionInfo__item">
            <span className="key text-muted">
              <FormattedMessage id="collection.info_url" defaultMessage="Information URL" />
            </span>
            <span className="value">
              <URL value={collection.info_url} itemProp="identifier" />
            </span>
          </div>
        )}
        { collection.data_url && (
          <div className="CollectionInfo__item">
            <span className="key text-muted">
              <FormattedMessage id="collection.data_url" defaultMessage="Data URL" />
            </span>
            <span className="value">
              <URL value={collection.data_url} />
            </span>
          </div>
        )}
        { collection.creator && (
          <div className="CollectionInfo__item">
            <span className="key text-muted">
              <FormattedMessage id="collection.creator" defaultMessage="Manager" />
            </span>
            <span className="value">
              <Role.Link role={collection.creator} />
            </span>
          </div>
        )}
        { (collection.team && collection.team.length > 1) && (
          <div className="CollectionInfo__item">
            <span className="key text-muted">
              <FormattedMessage id="collection.team" defaultMessage="Accessible to" />
            </span>
            <span className="value">
              <Role.List roles={collection.team} />
            </span>
          </div>
        )}
        { collection.countries && !!collection.countries.length && (
          <div className="CollectionInfo__item">
            <span className="key text-muted">
              <FormattedMessage id="collection.countries" defaultMessage="Country" />
            </span>
            <span className="value" itemProp="spatialCoverage">
              <Country.List codes={collection.countries} />
            </span>
          </div>
        )}
        <div className="CollectionInfo__item">
          <span className="key text-muted">
            <FormattedMessage id="collection.updated_at" defaultMessage="Last updated" />
          </span>
          <span className="value" itemProp="dateModified">
            <Date value={collection.updated_at} />
          </span>
        </div>
      </div>
    );
  }
}

export default CollectionInfo;
