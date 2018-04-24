import React, {Component} from 'react';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';


class ErrorScreen extends Component {
  render() {
    const { title, description = '', visual = 'error' } = this.props;

    return (
      <Screen title={title}>
        <DualPane>
          <DualPane.ContentPane>
            <NonIdealState visual={visual} title={title} description={description} />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

export default ErrorScreen;
