import React, { Component } from 'react';


class Date extends Component {
  render() {
    const { value } = this.props;
    if (!value) return null;

    let date = value.split('T')[0];
    return (
      <span className='Date'>
        { date }
      </span>
    );
  }
}

export default Date;
