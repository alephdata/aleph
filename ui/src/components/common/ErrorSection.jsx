import React, {Component} from 'react';
import { NonIdealState } from '@blueprintjs/core';

import './ErrorSection.css';


class ErrorSection extends Component {
  render() {
    const { title, description = '', visual = 'error' } = this.props;
    
    return (
      <div className='ErrorSection'>
        <div className='inner-div'>
          <NonIdealState visual={visual} title={title} description={description} />
        </div>
      </div>
    )
  }
}

export default ErrorSection;
