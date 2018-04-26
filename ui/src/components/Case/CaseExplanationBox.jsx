import React, {Component} from 'react';
import {Icon} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';

import './CaseExplanationBox.css';

class CaseExplanationBox extends Component {
  render() {
    return (
      <div className='CaseExplanationBox'>
        <div className='explanation'>
          <Icon icon="briefcase" iconSize={100} color='white'/>
          <div className='explanation-padding'>
            <h1 className='title-explanation'>
              <FormattedMessage id="case.question" defaultMessage="What are cases?"/></h1>
            <p className='description-explanation'>
              <FormattedMessage id="case.description"
                                defaultMessage="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."/>
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default CaseExplanationBox