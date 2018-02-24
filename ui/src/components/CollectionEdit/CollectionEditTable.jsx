import React, {Component} from 'react';
import { FormattedMessage } from 'react-intl';
import {Button} from '@blueprintjs/core';

import './CollectionEditTable.css';
import CollectionEditRow from "./CollectionEditRow";


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
    const { permissions } = this.props;

    return (
      <form className='CollectionEditTable'>
        <table className="settings-table">
          <thead>
          <tr key={0}>
            <th className='topic'>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="collection.edit.permissionstable.view" defaultMessage="View"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="collection.edit.permissionstable.edit" defaultMessage="Edit"/>
            </th>
          </tr>
          </thead>
          <tbody className='table_body_alerts'>
          <CollectionEditRow
            permissions={permissions}
            type='system'
            handleCheckboxRead={this.handleCheckboxRead}
            handleCheckboxWrite={this.handleCheckboxWrite}/>
          <tr key={1} className='table-row'>
            <td className='first-row header_topic'>
              <FormattedMessage id="collection.edit.groups" defaultMessage="Groups"/>
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          <CollectionEditRow
            permissions={permissions}
            type='group'
            handleCheckboxRead={this.handleCheckboxRead}
            handleCheckboxWrite={this.handleCheckboxWrite}/>
          <tr key={2} className='table-row'>
            <td className='first-row header_topic'>
              <FormattedMessage id="collection.edit.users" defaultMessage="Users"/>
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          <CollectionEditRow
            permissions={permissions}
            type='user'
            handleCheckboxRead={this.handleCheckboxRead}
            handleCheckboxWrite={this.handleCheckboxWrite}/>
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
