import React, { PureComponent } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Callout, Intent } from '@blueprintjs/core';

import {
  Date, Entity, Skeleton, Schema,
} from 'src/components/common';

import './MappingIndexItem.scss';


class MappingIndexItem extends PureComponent {
  renderSkeleton = () => (
    <div className="MappingIndexItem">

    </div>
  )

  render() {
    const { isPending, mapping } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }
    const { entityset, last_run_status, last_run_err_msg, query, showTableLink, table, updated_at } = mapping;
    const title = (showTableLink && table) ? <Entity.Link entity={table} icon /> : 'Test Title';
    console.log('mapping', mapping);
    return (
      <Callout
        className="MappingIndexItem"
      >
        <div className="MappingIndexItem__main">
          <h4 className="bp3-heading">{title}</h4>
          <div className="MappingIndexItem__schemata">
            {Object.keys(query).map(schema => <Schema.Label schema={schema} icon plural />)}
          </div>
        </div>
        <div className="MappingIndexItem__secondary">
          <h6 className="bp3-heading MappingIndexItem__statusItem">
            <span>
              <FormattedMessage
                id="mapping.status.updated"
                defaultMessage="Last updated:"
              />
            </span>
            <span>
              <Date value={updated_at} showTime />
            </span>
          </h6>
          {last_run_status && (
            <h6 className="bp3-heading MappingIndexItem__statusItem">
              <span>
                <FormattedMessage
                  id="mapping.status.status"
                  defaultMessage="Status:"
                />
              </span>
              <span>
                {mapping.last_run_status}
              </span>
            </h6>
          )}
          {last_run_err_msg && (
            <h6 className="bp3-heading MappingIndexItem__statusItem">
              <span>
                <FormattedMessage
                  id="mapping.status.error"
                  defaultMessage="Error:"
                />
              </span>
              <span>
                {last_run_err_msg}
              </span>
            </h6>
          )}
        </div>
      </Callout>
    );
  }
}

export default MappingIndexItem;
