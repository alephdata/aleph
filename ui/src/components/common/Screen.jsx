import React, { Component } from 'react';
import { withRouter } from 'react-router';

import './Screen.css';

class Screen extends Component {

  componentDidMount() {
    window.scrollTo(0, 0)
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    const { children } = this.props;
    return (
      <div className="Screen">
        { children }
      </div>
    )
  }
}

export default withRouter(Screen);
