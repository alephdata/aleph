import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteDiagram } from 'src/actions';


const messages = defineMessages({
  button_confirm: {
    id: 'diagram.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'diagram.delete.cancel',
    defaultMessage: 'Cancel',
  },
});


class DiagramDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { diagram, history } = this.props;
    const path = diagram.casefile ? '/cases' : '/datasets';
    await this.props.deleteDiagram(diagram);
    history.push({ pathname: path });
  }

  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        icon="trash"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onDelete}
      >
        <FormattedMessage
          id="diagram.delete.question"
          defaultMessage="Are you sure you want to delete this diagram?"
        />
      </Alert>
    );
  }
}

const mapDispatchToProps = { deleteDiagram };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(DiagramDeleteDialog);
