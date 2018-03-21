import React from 'react';

import './Toolbar.css';

export default class extends React.Component {
  render() {
    return (
      <div className={`Toolbar ${this.props.className || null}`}>
        {this.props.children}
      </div>
    );
  }
}