import React, { Component } from 'react';
import { Button, InputGroup } from '@blueprintjs/core';
import truncateText from 'truncate';

import { Schema } from 'components/common';

import './MappingLabel.scss';

export class MappingLabel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: false,
      editValue: this.getLabelText(),
    };
  }

  toggleEditing = () => {
    this.setState(({ editing }) => ({ editing: !editing }));
  };

  getLabelText = () => {
    const { mapping, truncate } = this.props;
    const text = mapping.altLabel || mapping.id;
    return truncate ? truncateText(text, truncate) : text;
  };

  getLabelIcon = (className) => {
    const { icon = true, mapping } = this.props;
    return (
      icon && <Schema.Icon schema={mapping.schema} className={className} />
    );
  };

  onSubmit = (e) => {
    const { mapping, onEdit } = this.props;
    const { editValue } = this.state;
    e.preventDefault();
    e.stopPropagation();
    onEdit(mapping.id, editValue);
    this.toggleEditing();
  };

  renderEditor() {
    const { editValue } = this.state;

    return (
      <form className="MappingLabel__input" onSubmit={this.onSubmit}>
        <InputGroup
          autoFocus
          value={editValue}
          leftIcon={this.getLabelIcon()}
          onChange={(e) => this.setState({ editValue: e.target.value })}
          rightElement={
            <Button minimal icon="arrow-right" onClick={this.onSubmit} />
          }
        />
      </form>
    );
  }

  renderButton() {
    const { mapping, icon = true } = this.props;

    return (
      <Button
        onClick={this.toggleEditing}
        minimal
        className="MappingLabel__button"
        text={this.getLabelText()}
        icon={icon && <Schema.Icon schema={mapping.schema} />}
      />
    );
  }

  renderLabel() {
    return (
      <>
        {this.getLabelIcon('left-icon')}
        {this.getLabelText()}
      </>
    );
  }

  render() {
    const { mapping, onEdit } = this.props;
    const { editing } = this.state;
    if (!mapping || !mapping.schema || !mapping.id) return null;

    let content;
    if (editing) {
      content = this.renderEditor();
    } else if (onEdit) {
      content = this.renderButton();
    } else {
      content = this.renderLabel();
    }

    return (
      <span className="MappingLabel" style={{ color: mapping.color }}>
        {content}
      </span>
    );
  }
}
