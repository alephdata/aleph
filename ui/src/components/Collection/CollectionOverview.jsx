import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Category, Country, Role, Date, Collection, URL,
} from 'src/components/common';

import './CollectionOverview.scss';
import ClipboardInput from '../ClipboardInput';

class CollectionOverview extends PureComponent {
  render() {
    const { collection, hasHeader = false } = this.props;
    if (!collection) {
      return null;
    }


    return (
      <div className="CollectionOverview">
        {hasHeader && (
          <h4>
            <Collection.Link collection={collection} />
          </h4>
        )}
        <p itemProp="description">{collection.summary}</p>
        <ul className="info-sheet">
          { !collection.casefile && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.category" defaultMessage="Category" />
              </span>
              <span className="value">
                <Category collection={collection} />
              </span>
            </li>
          )}
          { (collection.publisher || collection.publisher_url) && (
            <li>
              <span className="key">
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
            </li>
          )}
          { collection.info_url && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.info_url" defaultMessage="Information URL" />
              </span>
              <span className="value">
                <URL value={collection.info_url} itemProp="identifier" />
              </span>
            </li>
          )}
          { collection.data_url && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.data_url" defaultMessage="Data URL" />
              </span>
              <span className="value">
                <URL value={collection.data_url} />
              </span>
            </li>
          )}
          { collection.creator && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.creator" defaultMessage="Manager" />
              </span>
              <span className="value">
                <Role.Link role={collection.creator} />
              </span>
            </li>
          )}
          { (collection.team && collection.team.length > 1) && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.team" defaultMessage="Accessible to" />
              </span>
              <span className="value">
                <Role.List roles={collection.team} />
              </span>
            </li>
          )}
          { collection.countries && !!collection.countries.length && (
            <li>
              <span className="key">
                <FormattedMessage id="collection.countries" defaultMessage="Country" />
              </span>
              <span className="value" itemProp="spatialCoverage">
                <Country.List codes={collection.countries} />
              </span>
            </li>
          )}
          <li>
            <span className="key">
              <FormattedMessage id="collection.updated_at" defaultMessage="Last updated" />
            </span>
            <span className="value" itemProp="dateModified">
              <Date value={collection.updated_at} />
            </span>
          </li>
          <li>
            <span className="key">
              <FormattedMessage
                defaultMessage="Reconcile"
                id="collection.reconcile"
              />
            </span>
            <span className="value bp3-callout">
              <span className="bp3-text-small bp3-text-muted bp3-monospace-text">
                <FormattedMessage
                  id="collection.reconcile.description"
                  defaultMessage="Use the entities in this collection for data cleaning with the free OpenRefine[Link: openrefine.org]
                tool by adding the following reconciliation endpoint"
                />
              </span>
              <ClipboardInput value={collection.links.reconcile} />
            </span>
          </li>
        </ul>
      </div>
    );
  }
}

export default CollectionOverview;
