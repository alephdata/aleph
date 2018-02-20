import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import {Checkbox} from '@blueprintjs/core';
import {Button} from '@blueprintjs/core';

import './CollectionEditTable.css';
import {connect} from "react-redux";

class CollectionEditTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      users: []
    };

    this.onSave = this.onSave.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log('will receive', nextProps)
    this.setState({
      users: nextProps.users
    })
  }

  onSave() {
    console.log('on save', this.props.collection)
  }

  render() {
    console.log('users', this.props.users)
    const {permissions, users} = this.props;
    const hasAlerts = !(permissions.results !== undefined && permissions.results.length === 0);

    if (!hasAlerts || permissions.results === undefined) {
      return <NonIdealState visual="" title="There are no permissions"/>
    }

    let stateRows = permissions.results !== undefined ? permissions.results[0].map((permission, index) => (
      (permission.role.type === 'system' && <tr key={index} className='table-row'>
        <td className='first-row'>
          {permission.role.name}
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={permission.read}/>
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={permission.role.writable}/>
        </td>
      </tr>)
    )) : <tr/>;

    let groupRows = permissions.results !== undefined ? permissions.results[0].map((permission, index) => (
      (permission.role.type === 'group' && <tr key={index} className='table-row'>
        <td className='first-row'>
          {permission.role.name}
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={permission.read}/>
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={permission.role.writable}/>
        </td>
      </tr>)
    )) : <tr/>;

    let userRows = (users.length !== 0 && users.map((users, index) => (
      (<tr key={index} className='table-row'>
        <td className='first-row'>
          {users.role.name}
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={users.read}/>
        </td>
        <td className='other-rows'>
          <input type="checkbox" defaultChecked={users.role.writable}/>
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
    };
};

export default connect(mapStateToProps)(CollectionEditTable);
