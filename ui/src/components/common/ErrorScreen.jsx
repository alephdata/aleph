import React, {Component} from 'react';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';
import ErrorSection from 'src/components/common/ErrorSection';


class ErrorScreen extends Component {
  render() {
    const { title = '', error } = this.props;
    const screenTitle = error === undefined ? title : error.message;

    return (
      <Screen title={screenTitle}>
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
