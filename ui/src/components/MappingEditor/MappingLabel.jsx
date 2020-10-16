import React, { Component } from 'react';
import { Button, InputGroup } from '@blueprintjs/core';

import { Schema } from 'components/common';

export class MappingLabel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: false,
      editValue: props.mapping.id
    };
  }

  toggleEditing = () => {
    this.setState(({ editing }) => ({ editing: !editing }));
  }

  onSubmit = (e) => {
    const { mapping, onEdit } = this.props;
    const { editValue } = this.state;
    e.preventDefault();
    e.stopPropagation();
    onEdit(mapping.id, editValue);
    this.toggleEditing();
  }

  render() {
    const { mapping, icon = true, onEdit } = this.props;
    const { editing, editValue } = this.state;
    if (!mapping || !mapping.schema || !mapping.id) return null;

    if (editing) {
      return (
        <form onSubmit={this.onSubmit}>
          <InputGroup
            value={editValue}
            onChange={(e) => this.setState({ editValue: e.target.value })}
          />
        </form>
      )
    }

    const label = (
      <>
        {icon && <Schema.Icon schema={mapping.schema} className="left-icon" />}
        {mapping.id}
      </>
    );

    if (onEdit) {
      return (
        <Button onClick={this.toggleEditing} minimal>{label}</Button>
      )
    } else {
      return label;
    }
  }
};
