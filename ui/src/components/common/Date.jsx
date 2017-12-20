import React, { Component } from 'react';


class Date extends Component {
  render() {
    const { value } = this.props;
    let date = value.split('T')[0];
    return (
      <span className='Date'>
        D{ date }
      </span>
    );
  }
}

export default Date;
