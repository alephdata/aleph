import React, {Component} from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import './ErrorScreen.css';

const messages = defineMessages({
  no_path: {
    id: 'error.screen.no_path',
    defaultMessage: 'The requested page could not be found.'
  }
});

class EmptyList extends Component {
  render() {
    const { title, description = '', visual = 'error' } = this.props;
    
    return (
      <div className='outer-div'>
        <div className='inner-div'>
          <NonIdealState visual={visual} title={title} description={description} />
        </div>
      </div>
    )
  }
}

class PageNotFound extends Component {
  render() {
    const {intl, title, description = '', visual = 'error' } = this.props;
    const message = title !== undefined ? title : intl.formatMessage(messages.no_path);
    
    return (
      <Screen>
        <DualPane>
          <DualPane.ContentPane>
            <NonIdealState visual={visual} title={message} description={description} />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

class ErrorScreenNoTranslation extends Component {
    render() {
        const { title } = this.props;

        return (
            <Screen>
                <DualPane>
                    <DualPane.ContentPane>
                        <NonIdealState visual='error' title={title} />
                    </DualPane.ContentPane>
                </DualPane>
            </Screen>
        )
    }
}

class ErrorScreen extends Component {
  static PageNotFound = injectIntl(PageNotFound);
  static EmptyList = EmptyList;
  static NoTranslation = ErrorScreenNoTranslation;
}

export default ErrorScreen;
