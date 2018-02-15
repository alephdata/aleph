import React, { Component } from 'react';


class Label extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    const { role, icon = true } = this.props;

    return (
      <span>
        { icon && (<i className='fa fa-fw fa-user-circle-o' />) }
        { role.name }
      </span>
    );
  }
}


class Role {
  static Label = Label;
}

export default Role;
