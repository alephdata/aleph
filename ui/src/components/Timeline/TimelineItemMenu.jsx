import React, { Component } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Intent, Menu, Popover } from '@blueprintjs/core';
import queryString from 'query-string';

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
  }
});

class TimelineItemMenu extends Component {
  constructor(props) {
    super(props);

    this.onCopyLink = this.onCopyLink.bind(this);
  }

  onCopyLink() {
    const { entity, intl } = this.props;

    const location = window.location;
    const shadowInput = document.createElement("input");
    const itemHash = queryString.stringify({ id: entity.id });
    shadowInput.type = "text";
    shadowInput.value = `${location.origin}${location.pathname}${location.search}#${itemHash}`;
    shadowInput.classList.add('TimelineItemMenu__hidden-input')
    document.body.appendChild(shadowInput);

    shadowInput.select();
    document.execCommand('copy');
    showSuccessToast(intl.formatMessage(messages.link_copy_success));
  }

  renderDraft() {
    const { onDelete } = this.props;

    return (
      <Button className="TimelineItemMenu__toggle" minimal icon="cross" onClick={() => onDelete()} />
    );
  }

  renderFull() {
    const { entity, intl, onDelete, onRemove } = this.props;

    return (
      <Popover>
        <Button className="TimelineItemMenu__toggle" minimal icon="more" />
        <Menu>
          <Menu.Item
            onClick={this.onCopyLink}
            text={intl.formatMessage(messages.link_copy)}
            icon="link"
          />
          <Menu.Item
            onClick={() => onRemove(entity.id)}
            text={intl.formatMessage(messages.remove)}
            icon="remove"
          />
          <Menu.Item
            onClick={() => onDelete(entity.id)}
            text={intl.formatMessage(messages.delete, { collection: <Collection.Label collection={entity.collection} icon={false} /> })}
            icon="trash"
            intent={Intent.DANGER}
          />
        </Menu>
      </Popover>
    );
  }

  render() {
    const { isDraft } = this.props;

    return (
      <div className="TimelineItemMenu">
        {isDraft && this.renderDraft()}
        {!isDraft && this.renderFull()}
      </div>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(TimelineItemMenu);
