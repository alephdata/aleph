import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Date } from 'src/components/common';
import { Button, Tooltip } from '@blueprintjs/core';


const messages = defineMessages({
  delete_listing: {
    id: 'entityImport.delete.tooltip',
    defaultMessage: 'Remove mapping',
  },
});

class EntityImportListings extends PureComponent {
  render() {
    const { intl, items, onDelete } = this.props;

    return (
      <table className="EntityImportListings settings-table">
        <tbody>
          {items.map(item => (
            <tr key={item.id || item.last} className="EntityImportListings__row">
              <td className="EntityImportListings__button narrow">
                {Object.keys(item.query)}
              </td>
              <td className="EntityImportListings__button narrow">
                <Date value={item.created_at} showTime />
              </td>
              <td className="EntityImportListings__button narrow">
                <Tooltip
                  content={intl.formatMessage(messages.delete_listing)}
                >
                  <Button
                    icon="cross"
                    minimal
                    small
                    onClick={() => onDelete(item)}
                  />
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
export default injectIntl(EntityImportListings);
