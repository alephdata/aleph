import React, { Component } from 'react';
import { Dialog, Button, Intent, FormGroup } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import { Role } from 'src/components/common';
import { showWarningToast } from 'src/app/toast';
import { queryGroups } from 'src/queries';
import { queryRoles } from 'src/actions';
import { selectCurrentRole, selectRolesResult } from 'src/selectors';

const messages = defineMessages({
  title: {
    id: 'xref.context.title',
    defaultMessage: 'Cross-reference match review',
  },
  select: {
    id: 'xref.context.select',
    defaultMessage: 'Share with:',
  },
  private: {
    id: 'xref.context.private',
    defaultMessage: 'Keep private (no sharing)',
  },
  submit: {
    id: 'xref.context.submit',
    defaultMessage: 'Start review',
  },
});


class XrefContextDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { contextId: props.contextId };
    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeContext = this.onChangeContext.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.isOpen !== nextProps.isOpen
      || this.state.contextId !== nextState.contextId;
  }

  async onSubmit(event) {
    const { contextId } = this.state;
    event.preventDefault();
    try {
      this.props.updateContext(contextId);
      this.props.toggleDialog();
      this.setState({ contextId: undefined });
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  onChangeContext(role) {
    this.setState({ contextId: role.id });
  }

  render() {
    const { intl, isOpen, role, groups } = this.props;
    const { contextId } = this.state;
    const keepPrivate = {
      ...role,
      label: intl.formatMessage(messages.private)
    };
    const roles = [keepPrivate, ...groups.results];
    const active = roles.find((r) => r.id === contextId) || keepPrivate;
    return (
      <Dialog
        icon="flow-review"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={this.props.toggleDialog}
      >
        <div>
          <form onSubmit={this.onSubmit}>
            <div className="bp3-dialog-body">
              <p>
                <FormattedMessage
                  id="xref.context.explain1"
                  defaultMessage="Reviewing cross-reference matches helps you to flag and share leads. Your judgements are sensitive information, so please select what group of users can view your decisions."
                />
              </p>
              <FormGroup label={intl.formatMessage(messages.select)}>
                <Role.Select
                  role={active}
                  roles={roles}
                  onSelect={this.onChangeContext}
                />
              </FormGroup>
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  text={intl.formatMessage(messages.submit)}
                />
              </div>
            </div>
          </form>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const groupsQuery = queryGroups(ownProps.location);
  return {
    groups: selectRolesResult(state, groupsQuery),
    role: selectCurrentRole(state),
  };
};


XrefContextDialog = injectIntl(XrefContextDialog);
XrefContextDialog = connect(mapStateToProps, { queryRoles })(XrefContextDialog);
XrefContextDialog = withRouter(XrefContextDialog);
export default XrefContextDialog;
