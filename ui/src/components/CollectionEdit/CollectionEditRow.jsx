import React, {Component} from 'react';
import {Checkbox} from '@blueprintjs/core';

class CollectionEditRow extends Component {

  constructor(props) {
    super(props);

    this.handleCheckboxRead = this.handleCheckboxRead.bind(this);
    this.handleCheckboxWrite = this.handleCheckboxWrite.bind(this);
  }

  handleCheckboxRead(item) {
    this.props.handleCheckboxRead(item);
  }

  handleCheckboxWrite(item) {
    this.props.handleCheckboxWrite(item);
  }

  render() {
    const {permissions, type} = this.props;

    return (
      (permissions.results !== undefined && permissions.results[0].map((permission, index) => (
        (permission.role.type === type && <tr key={index} className='table-row'>
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
      )))
    )
  }
}

export default CollectionEditRow;
