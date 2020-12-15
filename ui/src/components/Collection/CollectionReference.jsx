import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Divider, InputGroup } from '@blueprintjs/core';

import { ClipboardInput, Skeleton } from 'components/common';

import './CollectionReference.scss';

class CollectionReference extends React.PureComponent {
  renderSkeleton() {
    return (
      <div className="CollectionReference">
        <div className="CollectionReference__section">
          <div className="key text-muted">
            <Skeleton.Text type="span" length={10} />
          </div>
          <div className="value">
            <Skeleton.Text type="span" length={40} />
          </div>
        </div>
        <Divider />
        <div className="CollectionReference__section">
          <div className="key text-muted">
            <Skeleton.Text type="span" length={10} />
          </div>
          <div className="value">
            <InputGroup readOnly disabled />
            <Skeleton.Text type="span" length={100} className="bp3-text-small" />
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { collection } = this.props;
    if (collection.isPending) {
      return this.renderSkeleton();
    }
    return (
      <div className="CollectionReference">
        <div className="CollectionReference__section">
          <div className="key text-muted">
            <FormattedMessage id="collection.foreign_id" defaultMessage="Foreign ID" />
          </div>
          <div className="value">
            <code>{collection.foreign_id}</code>
          </div>
        </div>
        <Divider />
        <div className="CollectionReference__section">
          <div className="key text-muted">
            <FormattedMessage id="collection.reconcile" defaultMessage="Reconciliation" />
          </div>
          <div className="value">
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
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(CollectionReference);
