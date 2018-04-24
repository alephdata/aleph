import React, {Component} from 'react';
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';
import ErrorSection from 'src/components/common/ErrorSection';


class ErrorScreen extends Component {
  render() {
    const { title } = this.props;

    return (
      <Screen title={title}>
        <DualPane>
          <DualPane.ContentPane>
            <ErrorSection {...this.props} />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

export default ErrorScreen;
