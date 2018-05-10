import React, {Component} from 'react';
import {Icon, Button} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';

import './CaseExplanationBox.css';

class CaseExplanationBox extends Component {
  constructor(props) {
    super(props);

    this.toggleCreateCase = this.toggleCreateCase.bind(this);
  }

  toggleCreateCase() {
    this.props.toggleCreateCase()
  }

  render() {
    const { hasCases } = this.props;

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
            {hasCases && <Button onClick={this.toggleCreateCase} icon="plus" className="add-case-button">
              <FormattedMessage id="case.add" defaultMessage="Add new case"/>
            </Button>}
          </div>
        </div>
      </div>
    )
  }
}

export default CaseExplanationBox