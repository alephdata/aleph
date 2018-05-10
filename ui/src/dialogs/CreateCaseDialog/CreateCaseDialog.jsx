import React, {Component} from "react";
import {Dialog, Button, Intent} from "@blueprintjs/core";
import {defineMessages, FormattedMessage, injectIntl} from "react-intl";
import {connect} from "react-redux";
import {withRouter} from "react-router";

import {createCollection, updateCollectionPermissions} from "src/actions";

import {Role} from "src/components/common";

import "./CreateCaseDialog.css";
import {showSuccessToast} from "../../app/toast";

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
  create_case: {
    id: "case.title",
    defaultMessage: "Create a new casefile"
  }
});

class CreateCaseDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      permissions: [],
      collection: {casefile: true}
    };

    this.onAddCase = this.onAddCase.bind(this);
    this.onChangeProject = this.onChangeProject.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onAddRole = this.onAddRole.bind(this);
    this.onDeleteRole = this.onDeleteRole.bind(this);
  }

  onAddRole(role) {
    const {permissions} = this.state;
    permissions.push({role: role, read: true, write: false});
    this.setState({permissions: permissions});
  }

  onDeleteRole(role) {
    const {permissions} = this.state;
    const newPermissions = permissions.filter((permission) => permission.role.id !== role.role.id);
    this.setState({permissions: newPermissions});
  }

  onAddCase() {
    const {onAddCase} = this.props;
    const {permissions, collection} = this.state;

    onAddCase(collection, permissions);
  }

  onChangeProject({target}) {
    let collectionNew = this.state.collection;
    collectionNew.label = target.value;
    this.setState({collection: collectionNew});
  }

  onChangeSummary({target}) {
    let collectionNew = this.state.collection;
    collectionNew.summary = target.value;
    this.setState({collection: collectionNew});
  }

  render() {
    const {intl} = this.props;
    const {permissions} = this.state;
    const exclude = permissions.map((perm) => perm.role.id);

    return (
      <Dialog icon="briefcase" className="CreateCaseDialog"
              isOpen={this.props.isOpen}
              title={intl.formatMessage(messages.create_case)}
              onClose={this.props.toggleDialog}>
        <div className="pt-dialog-body">
          <div className="pt-form-group">
            <label className="pt-label">
              <FormattedMessage id="case.choose.name" defaultMessage="Choose a title:"/>
            </label>
            <div className="pt-input-group pt-large pt-fill">
              <input id="label"
                     type="text"
                     autoFocus={true}
                     className="pt-input"
                     autoComplete="off"
                     placeholder={intl.formatMessage(messages.untitled_label)}
                     onChange={this.onChangeLabel}
                     value={this.state.collection.label}/>
            </div>
          </div>
          <div className="pt-form-group">
            <label className="pt-label">
              <FormattedMessage id="case.choose.summary" defaultMessage="Describe it briefly:"/>
            </label>
            <div className="pt-input-group pt-fill">
              <textarea id="summary"
                        className="pt-input"
                        placeholder={intl.formatMessage(messages.summary)}
                        onChange={this.onChangeSummary}
                        value={this.state.collection.summary} />
            </div>
          </div>
          <div className="pt-form-group">
            <label className="pt-label">
              <FormattedMessage id="case.share.with" defaultMessage="Share with"/>
            </label>
            <div className="pt-input-group pt-fill">
              <Role.Select onSelect={this.onAddRole}
                           exclude={exclude} />
            </div>
          </div>
          {permissions.length !== 0 && <table className="settings-table">
            <thead>
              <tr key={0}>
                <th><FormattedMessage id="case.name" defaultMessage="Name"/></th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) =>
                <tr key={permission.role.id + 1}>
                  <td>{permission.role.name}</td>
                  <td>{permission.role.email}</td>
                  <td><a onClick={(e) => this.onDeleteRole(permission, e)}><FormattedMessage id="case.remove"
                                                                                            defaultMessage="Remove"/></a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>}
          
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onAddCase}
              text={intl.formatMessage(messages.save)} />
          </div>
        </div>
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
