import React, { Component } from 'react';
import { min } from 'lodash';


class Earliest extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.values !== nextProps.values;
  }
  
  render() {
    const earliest = min(this.props.values);
    return <Date value={earliest} />
  }
}


class Date extends Component {
  static Earliest = Earliest;

  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    const { value } = this.props;
    if (!value) return null;

    let date = value;
    try {
	date = value.split('T')[0];
    }catch(ex) {
        // Not a complete date, just show what we got
    }
    return (<span className='Date' title={value}>{date}</span>);
  }
}

export default Date;
