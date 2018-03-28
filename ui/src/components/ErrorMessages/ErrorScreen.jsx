import React, {Component} from 'react';
import { injectIntl } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import './ErrorScreen.css';

class EmptyList extends Component {
  render() {
    const {title, intl} = this.props;
    let visual = this.props.visual !== undefined ? this.props.visual : 'error';
    let description = this.props.description !== undefined ? this.props.description
      : {id: 'error_desc', defaultMessage: ' '};

    return (
      <div className='outer-div'>
        <div className='inner-div'>
          <NonIdealState
            visual={visual}
            title={intl.formatMessage(title)}
            description={intl.formatMessage(description)}
          />
        </div>
      </div>
    )
  }
}

class LinkDescription extends Component {
  render() {
    const {title, intl, isPage} = this.props;
    let visual = this.props.visual !== undefined ? this.props.visual : 'error';
    let description = this.props.description !== undefined ? this.props.description
      : {id: 'error_desc', defaultMessage: ' '};
    let main = isPage ? <Screen>
      <DualPane>
        <DualPane.ContentPane>
          <NonIdealState
            visual={visual}
            title={intl.formatMessage(title)}
            description={<a href='/login'>{intl.formatMessage(description)}</a>}
          />
        </DualPane.ContentPane>
      </DualPane>
    </Screen> : <div className='outer-div'>
      <div className='inner-div'>
        <NonIdealState
          visual={visual}
          title={intl.formatMessage(title)}
          description={<a href='/login'>{intl.formatMessage(description)}</a>}
        />
      </div>
    </div>;

    return (
      <React.Fragment>
        {main}
      </React.Fragment>
    )
  }
}

class PageNotFound extends Component {
  render() {
    const {intl, title} = this.props;
    let visual = this.props.visual !== undefined ? this.props.visual : 'error';
    let description = this.props.description !== undefined ? this.props.description
      : {id: 'error_desc', defaultMessage: ' '};
    return (
      <Screen>
        <DualPane>
          <DualPane.ContentPane>
            <NonIdealState
              visual={visual}
              title={intl.formatMessage(title)}
              description={intl.formatMessage(description)}
            />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

class ErrorScreen extends Component {
  static PageNotFound = injectIntl(PageNotFound);
  static EmptyList = injectIntl(EmptyList);
  static LinkDescription = injectIntl(LinkDescription);
}

export default ErrorScreen;
