import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import {Checkbox} from '@blueprintjs/core';
import {Button} from '@blueprintjs/core';

import './CollectionEditTable.css';

class CollectionEditTable extends Component {

  constructor(props) {
    super(props);

    this.onSave = this.onSave.bind(this);
    this.handleCheckboxRead = this.handleCheckboxRead.bind(this);
    this.handleCheckboxWrite = this.handleCheckboxWrite.bind(this);
  }

  async onSave() {
    this.props.onSave();
  }

  handleCheckboxRead(item) {
    this.props.handleCheckboxRead(item);
  }

  handleCheckboxWrite(item) {
    this.props.handleCheckboxWrite(item);
  }

  render() {
    const {permissions} = this.props;
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
      (permission.role.type === 'user' && <tr key={index} className='table-row'>
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
          <tr className='table-row'>
            <td className='first-row header_topic'>
              Groups
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          {groupRows}
          <tr className='table-row'>
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

export default CollectionEditTable;
