import React, { Component } from 'react';
import { Button, Classes, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import c from 'classnames';

import { updateEntitySet } from '/src/actions/index.js';
import { showSuccessToast, showWarningToast } from '/src/app/toast';
import { EntitySet } from '/src/components/common/index.jsx';
import FormDialog from '/src/dialogs/common/FormDialog.jsx';

const messages = defineMessages({
  save: {
    id: 'entityset.update.submit',
    defaultMessage: 'Save changes',
  },
  list_title: {
    id: 'list.update.title',
    defaultMessage: 'List settings',
  },
  list_label_placeholder: {
    id: 'list.update.label_placeholder',
    defaultMessage: 'Untitled list',
  },
  list_summary_placeholder: {
    id: 'list.update.summary_placeholder',
    defaultMessage: 'A brief description of the list',
  },
  list_success: {
    id: 'list.update.success',
    defaultMessage: 'Your list has been updated successfully.',
  },
  diagram_title: {
    id: 'diagram.update.title',
    defaultMessage: 'Diagram settings',
  },
  diagram_label_placeholder: {
    id: 'diagram.update.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  diagram_summary_placeholder: {
    id: 'diagram.update.summary_placeholder',
    defaultMessage: 'A brief description of the diagram',
  },
  diagram_success: {
    id: 'diagram.update.success',
    defaultMessage: 'Your diagram has been updated successfully.',
  },
  timeline_title: {
    id: 'timeline.update.title',
    defaultMessage: 'Timeline settings',
  },
  timeline_label_placeholder: {
    id: 'timeline.update.label_placeholder',
    defaultMessage: 'Untitled timeline',
  },
  timeline_summary_placeholder: {
    id: 'timeline.update.summary_placeholder',
    defaultMessage: 'A brief description of the timeline',
  },
  timeline_success: {
    id: 'timeline.update.success',
    defaultMessage: 'Your timeline has been updated successfully.',
  },
});

class EntitySetEditDialog extends Component {
  constructor(props) {
    super(props);
    const { entitySet } = this.props;

    this.state = {
      label: entitySet.label || '',
      summary: entitySet.summary || '',
      processing: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      label: '',
      summary: '',
    });
  }

  async onSubmit() {
    const { entitySet, intl } = this.props;
    const { label, summary } = this.state;
    if (!this.checkValid()) return;
    this.setState({ processing: true });

    try {
      await this.props.updateEntitySet(entitySet.id, { label, summary });
      this.props.toggleDialog();
      showSuccessToast(
        intl.formatMessage(messages[`${entitySet.type}_success`])
      );
    } catch (e) {
      showWarningToast(e.message);
    }
    this.setState({ processing: false });
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  onChangeSummary({ target }) {
    this.setState({ summary: target.value });
  }

  checkValid() {
    const { label } = this.state;
    return label?.length > 0;
  }

  render() {
    const { entitySet, intl, isOpen, toggleDialog } = this.props;
    const { label, processing, summary } = this.state;
    const disabled = !this.checkValid();

    const { type } = entitySet;

    return (
      <FormDialog
        processing={processing}
        icon={<EntitySet.Icon entitySet={{ type }} />}
        isOpen={isOpen}
        onSubmit={this.onSubmit}
        title={intl.formatMessage(messages[`${type}_title`])}
        onClose={toggleDialog}
      >
        <div className={Classes.DIALOG_BODY}>
          <div className={Classes.FORM_GROUP}>
            <label className={Classes.LABEL} htmlFor="label">
              <FormattedMessage
                id="entityset.choose.name"
                defaultMessage="Title"
              />
              <div className={c(Classes.INPUT_GROUP, Classes.FILL)}>
                <input
                  id="label"
                  type="text"
                  className={Classes.INPUT}
                  autoComplete="off"
                  placeholder={intl.formatMessage(
                    messages[`${type}_label_placeholder`]
                  )}
                  onChange={this.onChangeLabel}
                  value={label}
                />
              </div>
            </label>
          </div>
          <div className={Classes.FORM_GROUP}>
            <label className={Classes.LABEL} htmlFor="summary">
              <FormattedMessage
                id="entityset.choose.summary"
                defaultMessage="Summary"
              />
              <div className={c(Classes.INPUT_GROUP, Classes.FILL)}>
                <textarea
                  id="summary"
                  className={Classes.INPUT}
                  placeholder={intl.formatMessage(
                    messages[`${type}_summary_placeholder`]
                  )}
                  onChange={this.onChangeSummary}
                  value={summary}
                  rows={5}
                />
              </div>
            </label>
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              disabled={disabled}
              text={intl.formatMessage(messages.save)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}

EntitySetEditDialog = injectIntl(EntitySetEditDialog);
export default connect(null, { updateEntitySet })(EntitySetEditDialog);
