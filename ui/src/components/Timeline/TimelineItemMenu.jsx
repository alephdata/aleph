import React, { Component } from 'react';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Intent, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';
import { ColorPicker } from 'react-ftm';
import queryString from 'query-string';

import withRouter from 'app/withRouter';
import { showSuccessToast } from 'app/toast';
import { Collection } from 'components/common';

import './TimelineItemMenu.scss';

const messages = defineMessages({
  link_copy: {
    id: 'timeline.item.link_copy',
    defaultMessage: 'Copy link to this item',
  },
  link_copy_success: {
    id: 'timeline.item.link_copy_success',
    defaultMessage: 'Successfully copied link to clipboard.',
  },
  remove: {
    id: 'timeline.item.remove',
    defaultMessage: 'Remove from timeline',
  },
  delete: {
    id: 'timeline.item.delete',
    defaultMessage: 'Delete from {collection}',
  },
});

class TimelineItemMenu extends Component {
  constructor(props) {
    super(props);

    this.onCopyLink = this.onCopyLink.bind(this);
  }

  onCopyLink() {
    const { entity, intl } = this.props;

    const location = window.location;
    const shadowInput = document.createElement('input');
    const itemHash = queryString.stringify({
      ...queryString.parse(location.hash),
      id: entity.id,
    });
    shadowInput.type = 'text';
    shadowInput.value = `${location.origin}${location.pathname}${location.search}#${itemHash}`;
    shadowInput.classList.add('TimelineItemMenu__hidden-input');
    document.body.appendChild(shadowInput);

    shadowInput.select();
    document.execCommand('copy');
    showSuccessToast(intl.formatMessage(messages.link_copy_success));
  }

  render() {
    const {
      color,
      entity,
      intl,
      onColorSelect,
      onDelete,
      onRemove,
      writeable,
    } = this.props;

    return (
      <div className="TimelineItemMenu">
        <Popover
          content={
            <Menu className="TimelineItemMenu__menu">
              {writeable && (
                <>
                  <ColorPicker currSelected={color} onSelect={onColorSelect} />
                  <MenuDivider />
                </>
              )}
              <MenuItem
                onClick={this.onCopyLink}
                text={intl.formatMessage(messages.link_copy)}
                icon="link"
              />
              {writeable && (
                <>
                  <MenuItem
                    onClick={() => onRemove(entity.id)}
                    text={intl.formatMessage(messages.remove)}
                    icon="remove"
                  />
                  <MenuItem
                    onClick={() => onDelete(entity.id)}
                    text={intl.formatMessage(messages.delete, {
                      collection: (
                        <Collection.Label
                          collection={entity.collection}
                          icon={false}
                        />
                      ),
                    })}
                    icon="trash"
                    intent={Intent.DANGER}
                  />
                </>
              )}
            </Menu>
          }
        >
          <Button
            className="TimelineItemMenu__toggle"
            minimal
            small
            icon="more"
          />
        </Popover>
      </div>
    );
  }
}

export default compose(withRouter, injectIntl)(TimelineItemMenu);
