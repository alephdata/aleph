import React, { Component } from 'react';


class Date extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    const { value } = this.props;
    if (!value) return null;

    let date = value.split('T')[0];
    return (
      <span className='Date' title={value}>
        { date }
      </span>
    );
  }
}

export default Date;
