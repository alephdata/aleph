import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Divider } from '@blueprintjs/core';

import { ClipboardInput } from 'components/common';

import './CollectionReference.scss';

class CollectionReference extends React.PureComponent {
  render() {
    const { collection } = this.props;

    return (
      <div className="CollectionReference">
        <div className="CollectionReference__section">
          <div className="key text-muted">
            <FormattedMessage id="collection.foreign_id" defaultMessage="Foreign ID" />
          </div>
          <div className="value">
            <ClipboardInput value={collection.foreign_id} />
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
