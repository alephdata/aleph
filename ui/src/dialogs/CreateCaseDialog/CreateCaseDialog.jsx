import React, {Component} from "react";
import { Dialog, Button, Intent } from "@blueprintjs/core";
import { defineMessages, FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import { createCollection, updateCollectionPermissions } from "src/actions";
import { showWarningToast } from "src/app/toast";
import { Role } from "src/components/common";
import getCollectionLink from 'src/util/getCollectionLink';

import "./CreateCaseDialog.scss";

const messages = defineMessages({
  untitled_label: {
    id: "case.untitled_label",
    defaultMessage: "Untitled case file",
  },
  summary: {
    id: "case.summary",
    defaultMessage: "Summary",
  },
  save: {
    id: "case.save",
    defaultMessage: "Save"
  },
  share_with: {
    id: "case.users",
    defaultMessage: "Search users",
  },
  title: {
    id: "case.title",
    defaultMessage: "Create a new casefile"
  }
});


class CreateCaseDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: {
        label: '',
        summary: '',
        casefile: true
      },
      permissions: [],
      blocking: false
    };

    this.onAddCase = this.onAddCase.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onAddRole = this.onAddRole.bind(this);
    this.onDeleteRole = this.onDeleteRole.bind(this);
  }

  onAddRole(role) {
    const { permissions } = this.state;
    permissions.push({role: role, read: true, write: true});
    this.setState({permissions: permissions});
  }

  onDeleteRole(role, event) {
    const { permissions } = this.state;
    const newPermissions = permissions.filter((permission) => permission.role.id !== role.role.id);
    this.setState({permissions: newPermissions});
  }

  async onAddCase(event) {
    const { history } = this.props;
    const { collection, permissions, blocking } = this.state;
    event.preventDefault();
    if (blocking) return;
    this.setState({blocking: true});
    try {
      const response = await this.props.createCollection(collection);
      const collectionId = response.data.id;
      await this.props.updateCollectionPermissions(collectionId, permissions);
      this.setState({blocking: false});
      history.push(getCollectionLink(response.data));
    } catch (e) {
      this.setState({blocking: false});
      showWarningToast(e.message);
    }
  }

  onChangeLabel({target}) {
    const { collection } = this.state;
    collection.label = target.value;
    this.setState({collection: collection});
  }

  onChangeSummary({target}) {
    const { collection } = this.state;
    collection.summary = target.value;
    this.setState({collection: collection});
  }

  render() {
    const { intl } = this.props;
    const { collection, permissions, blocking } = this.state;
    const exclude = permissions.map((perm) => parseInt(perm.role.id, 10));

    return (
      <Dialog icon="briefcase" className="CreateCaseDialog"
              isOpen={this.props.isOpen}
              title={intl.formatMessage(messages.title)}
              onClose={this.props.toggleDialog}>
        <form onSubmit={this.onAddCase}>
          <div className="bp3-dialog-body">
            <div className="bp3-form-group">
              <label className="bp3-label">
                <FormattedMessage id="case.choose.name" defaultMessage="Choose a title:"/>
              </label>
              <div className="bp3-input-group bp3-large bp3-fill">
                <input id="label"
                      type="text"
                      autoFocus={true}
                      className="bp3-input"
                      autoComplete="off"
                      placeholder={intl.formatMessage(messages.untitled_label)}
                      onChange={this.onChangeLabel}
                      value={collection.label} />
              </div>
            </div>
            <div className="bp3-form-group">
              <label className="bp3-label">
                <FormattedMessage id="case.choose.summary"
                                  defaultMessage="Describe it briefly:"/>
              </label>
              <div className="bp3-input-group bp3-fill">
                <textarea id="summary"
                          className="bp3-input"
                          placeholder={intl.formatMessage(messages.summary)}
                          onChange={this.onChangeSummary}
                          value={collection.summary} />
              </div>
            </div>
            <div className="bp3-form-group">
              <label className="bp3-label">
                <FormattedMessage id="case.share.with"
                                  defaultMessage="Share with"/>
              </label>
              <div className="bp3-input-group bp3-fill">
                <Role.Select onSelect={this.onAddRole} exclude={exclude} />
              </div>
            </div>
            {permissions.length !== 0 && (
              <table className="settings-table">
                <thead>
                  <tr key={0}>
                    <th>
                      <FormattedMessage id="case.name"
                                        defaultMessage="Name"/></th>
                    <th/>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) =>
                    <tr key={permission.role.id + 1}>
                      <td>
                        <Role.Label role={permission.role} icon={false} long={true} />
                      </td>
                      <td>
                        <Button onClick={(e) => this.onDeleteRole(permission, e)}
                                small={true} minimal={true} icon="remove" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          )}
          </div>
          <div className="bp3-dialog-footer">
            <div className="bp3-dialog-footer-actions">
              <Button type="submit"
                      intent={Intent.PRIMARY}
                      disabled={blocking}
                      text={intl.formatMessage(messages.save)} />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

CreateCaseDialog = injectIntl(CreateCaseDialog);
CreateCaseDialog = withRouter(CreateCaseDialog);
export default connect(mapStateToProps, {createCollection, updateCollectionPermissions})(CreateCaseDialog);
