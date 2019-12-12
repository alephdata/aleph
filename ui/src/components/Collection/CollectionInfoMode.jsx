import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Country, Role, Date, URL,
} from 'src/components/common';
import ClipboardInput from 'src/components/common/ClipboardInput';

class CollectionInfoMode extends PureComponent {
  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return (
      <div className="CollectionInfoMode">
        <div className="CollectionInfoMode__section">
          <ul className="info-sheet">
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
          </ul>
        </div>
        <div className="CollectionInfoMode__section">
          <ul className="info-sheet">
            <li>
              <span className="key">
                <FormattedMessage id="collection.foreign_id" defaultMessage="Foreign ID" />
              </span>
              <span className="value">
                <code>{collection.foreign_id}</code>
              </span>
            </li>
            <li>
              <span className="key">
                <FormattedMessage id="collection.reconcile" defaultMessage="Reconciliation" />
              </span>
              <span className="value bp3-callout">
                <ClipboardInput value={collection.links.reconcile} />
                <span className="bp3-text-small bp3-text-muted">
                  <FormattedMessage
                    id="collection.reconcile.description"
                    defaultMessage="Match your own data against the entities in this collection using the free {openrefine}
                  tool by adding the reconciliation endpoint."
                    values={{
                      openrefine: <a href="http://openrefine.org">OpenRefine</a>,
                    }}
                  />
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default CollectionInfoMode;
