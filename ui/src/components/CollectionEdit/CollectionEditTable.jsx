import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
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
    const {permissions} = this.props;
    const hasAlerts = !(permissions.results !== undefined && permissions.results.length === 0);

    if (!hasAlerts || permissions.results === undefined) {
      return <NonIdealState visual="" title="There are no permissions"/>
    }

    return (
      <form className='CollectionEditTable'>
        <table className="settings-table">
          <thead>
          <tr key={0}>
            <th className='topic'>
              <FormattedMessage id="collection.edit.types" defaultMessage="Types"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="collection.edit.view" defaultMessage="View"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="collection.edit.edit" defaultMessage="Edit"/>
            </th>
          </tr>
          </thead>
          <tbody className='table_body_alerts'>
          <CollectionEditRow permissions={permissions} type='system'/>
          <tr key={1} className='table-row'>
            <td className='first-row header_topic'>
              <FormattedMessage id="collection.edit.groups" defaultMessage="Groups"/>
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          <CollectionEditRow permissions={permissions} type='group'/>
          <tr key={2} className='table-row'>
            <td className='first-row header_topic'>
              <FormattedMessage id="collection.edit.groups" defaultMessage="Users"/>
            </td>
            <td className='other-rows'/>
            <td className='other-rows'/>
          </tr>
          <CollectionEditRow permissions={permissions} type='user'/>
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
