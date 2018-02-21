import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import {Checkbox} from '@blueprintjs/core';
import {Button} from '@blueprintjs/core';
import {connect} from "react-redux";

import './CollectionEditTable.css';
import {updateCollection} from "../../actions";
import {showSuccessToast} from "../../app/toast";

class CollectionEditTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      permissions: []
    };

    this.onSave = this.onSave.bind(this);
    this.handleCheckboxRead = this.handleCheckboxRead.bind(this);
    this.handleCheckboxWrite = this.handleCheckboxWrite.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log('users')
    this.setState({permissions: nextProps.permissions})
  }

  async onSave() {
    console.log('on save', this.state.permissions)
    await this.props.updateCollection(this.props.collection);
    await this.props.updateCollection(this.state.permissions);
    showSuccessToast('You have saved collection!');
  }

  handleCheckboxRead(item) {
    let newPermission = item;
    let permissions = this.state.permissions;
    for(let i = 0; i < this.state.permissions.results[0].length; i++) {
      if(this.state.permissions.results[0][i].role.id === item.role.id) {
        newPermission.read = !this.state.permissions.results[0][i].read;
        permissions.results[0][i] = newPermission;
      }
    }

    this.setState({permissions: permissions})
  }

  handleCheckboxWrite(item) {
    let newPermission = item;
    let permissions = this.state.permissions;
    for(let i = 0; i < this.state.permissions.results[0].length; i++) {
      if(this.state.permissions.results[0][i].role.id === item.role.id) {
        newPermission.write = !this.state.permissions.results[0][i].write;
        permissions.results[0][i] = newPermission;
      }
    }

    this.setState({permissions: permissions})
  }

  render() {
    const {permissions} = this.props;
    console.log('RENDER')
    const hasAlerts = !(permissions.results !== undefined && permissions.results.length === 0);

    if (!hasAlerts || permissions.results === undefined) {
      return <NonIdealState visual="" title="There are no permissions"/>
    }

    let stateRows = (permissions.results !== undefined && permissions.results[0].map((permission, index) => (
      (permission.role.type === 'system' && <tr key={index} className='table-row'>
        <td className='first-row'>
          {permission.role.name}
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.read} onChange={() => this.handleCheckboxRead(permission)}/>
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.write} onChange={() => this.handleCheckboxWrite(permission)}/>
        </td>
      </tr>)
    )));

    let groupRows = (permissions.results !== undefined && permissions.results[0].map((permission, index) => (
      (permission.role.type === 'group' && <tr key={index} className='table-row'>
        <td className='first-row'>
          {permission.role.name}
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.read} onChange={() => this.handleCheckboxRead(permission)}/>
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.write} onChange={() => this.handleCheckboxWrite(permission)}/>
        </td>
      </tr>)
    )));

    let userRows = (permissions.results !== undefined && permissions.results[0].map((permission, index) => (
      (permission.type === 'user' && <tr key={index} className='table-row'>
        <td className='first-row'>
          {permission.name}
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.read} onChange={() => this.handleCheckboxRead(permission)}/>
        </td>
        <td className='other-rows'>
          <Checkbox className='checkbox-center' checked={permission.write} onChange={() => this.handleCheckboxWrite(permission)}/>
        </td>
      </tr>)
    )));

    return (
      <form className='CollectionEditTable'>
        <table className="settings-table">
          <thead>
          <tr>
            <th className='topic'>
              <FormattedMessage id="alerts.topic" defaultMessage="Types"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="alerts.search" defaultMessage="View"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="alerts.delete" defaultMessage="Edit"/>
            </th>
          </tr>
          </thead>
          <tbody className='table_body_alerts'>
          {stateRows}
          <tr key={1} className='table-row'>
            <td className='first-row header_topic'>
              Groups
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          {groupRows}
          <tr key={2} className='table-row'>
            <td className='first-row header_topic'>
              Users
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          {userRows}
          </tbody>
        </table>
        <Button className="saveButton" onClick={this.onSave}>
          <FormattedMessage id="collection.edit.save"
                            defaultMessage="Save"/>
        </Button>
      </form>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
    return {
      permissions: state.permissions
    };
};

export default connect(mapStateToProps, {updateCollection})(CollectionEditTable);
