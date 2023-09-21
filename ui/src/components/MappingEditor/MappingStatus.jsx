import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Callout, Classes, Intent } from '@blueprintjs/core';
import c from 'classnames';
import { Date } from 'components/common';

import './MappingStatus.scss';

const MappingStatus = ({ mapping }) => {
  let intent =
    mapping.last_run_status === 'success' ? Intent.SUCCESS : Intent.PRIMARY;
  if (mapping.last_run_error) {
    intent = Intent.DANGER;
  }
  return (
    <Callout className="MappingStatus" intent={intent}>
      <div>
        <h6 className={c(Classes.HEADING, 'MappingStatus__statusItem')}>
          <span>
            <FormattedMessage
              id="mapping.status.updated"
              defaultMessage="Last updated:"
            />
          </span>
          <span>
            <Date value={mapping.updated_at} showTime />
          </span>
        </h6>
        {mapping.last_run_status && (
          <h6 className={c(Classes.HEADING, 'MappingStatus__statusItem')}>
            <span>
              <FormattedMessage
                id="mapping.status.status"
                defaultMessage="Status:"
              />
            </span>
            <span>{mapping.last_run_status}</span>
          </h6>
        )}
        {mapping.last_run_err_msg && (
          <h6 className={c(Classes.HEADING, 'MappingStatus__statusItem')}>
            <span>
              <FormattedMessage
                id="mapping.status.error"
                defaultMessage="Error:"
              />
            </span>
            <span>{mapping.last_run_err_msg}</span>
          </h6>
        )}
      </div>
    </Callout>
  );
};

export default injectIntl(MappingStatus);
