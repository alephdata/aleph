import React, {Component} from 'react';
import {Dialog, Button} from '@blueprintjs/core';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';

import {createCollection, updateCollectionPermissions} from 'src/actions';

import {Role} from 'src/components/common';

import './CreateCaseDialog.css';
import {showSuccessToast} from "../../app/toast";

const messages = defineMessages({
  untitled_project: {
    id: 'case.untitled_project',
    defaultMessage: 'Untitled project',
  },
  summary: {
    id: 'case.summary',
    defaultMessage: 'Summary',
  },
  share_with: {
    id: 'case.users',
    defaultMessage: 'Search users',
  },
  create_case: {
    id: 'case.title',
    defaultMessage: 'Create case'
  },
  save_success: {
    id: 'case.save_success',
    defaultMessage: 'You have created a case.',
  },
  save_error: {
    id: 'case.save_error',
    defaultMessage: 'Failed to create a case.',
  }
});

class CreateCaseDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      project: '',
      summary: '',
      permissions: [],
      collection: {caseFile: true}
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
    const { permissions } = this.state;
    const newPermissions = permissions.filter((permission) => permission.role.id !== role.role.id);
    this.setState({permissions: newPermissions});
  }

  async onAddCase() {
    const { intl, updateCollectionPermissions, createCollection } = this.props;
    const { permissions, collection } = this.state;

    try {
      console.log(collection)
      await createCollection(collection);
      showSuccessToast(intl.formatMessage(messages.save_success));
      this.props.toggleDialog();
    } catch (e) {
      alert(intl.formatMessage(messages.save_error));
    }

  }

  onChangeProject({target}) {
    let collectionNew = this.state.collection;
    let name = target.value;
    collectionNew.label = name;
    this.setState({project: name, collection: collectionNew});
  }

  onChangeSummary({target}) {
    let collectionNew = this.state.collection;
    let summary = target.value;
    collectionNew.summary = summary;
    this.setState({summary: target.value, collection: collectionNew});
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
              <FormattedMessage id="case.choose.name" defaultMessage="Choose a name for your new case."/>
            </label>
            <div className="pt-input-group pt-large pt-fill">
              <input type="text"
                     id='project'
                     autoFocus={true}
                     className="pt-input"
                     autoComplete="off"
                     placeholder={intl.formatMessage(messages.untitled_project)}
                     onChange={this.onChangeProject}
                     value={this.state.project}/>
            </div>
          </div>
          <div className="pt-form-group">
            <label className="pt-label">
              <FormattedMessage id="case.enter.summary" defaultMessage="Enter a summary."/>
            </label>
            <div className="pt-input-group pt-large pt-fill">
              <input type="text"
                     id='project'
                     autoFocus={true}
                     className="pt-input"
                     autoComplete="off"
                     placeholder={intl.formatMessage(messages.summary)}
                     onChange={this.onChangeSummary}
                     value={this.state.summary}/>
            </div>
          </div>
          <div className="pt-form-group">
            <label className="pt-label">
              <FormattedMessage id="case.share.with" defaultMessage="Share with"/>
            </label>
            <div className="pt-input-group pt-large pt-fill">
              <Role.Select onSelect={this.onAddRole}
                           exclude={exclude}/>
            </div>
          </div>
          {permissions.length !== 0 && <table className='settings-table'>
            <thead>
            <tr key={0}>
              <th><FormattedMessage id="case.name" defaultMessage="Name"/></th>
              <th><FormattedMessage id="case.email" defaultMessage="Email"/></th>
              <th/>
            </tr>
            </thead>
            <tbody>
            {permissions.map((permission) =>
            <tr key={permission.role.id + 1}>
              <td>{permission.role.name}</td>
              <td>{permission.role.email}</td>
              <td><a onClick={(e) => this.onDeleteRole(permission, e)}><FormattedMessage id="case.remove" defaultMessage="Remove"/></a></td>
            </tr>)}
            </tbody>
          </table>}
            <Button className="pt-intent-primary pt-large button-margin" onClick={this.onAddCase}>
              <FormattedMessage id="case.create" defaultMessage="Create case"/>
            </Button>
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
