import React from 'react';

import DualPane from 'src/components/common/DualPane';
import ErrorSection from 'src/components/common/ErrorSection';
import Screen from 'src/components/Screen/Screen';


function ErrorScreen(props) {
  const { title = '', error } = props;
  const screenTitle = error === undefined ? title : error.message;

  return (
    <Screen title={screenTitle}>
      <DualPane>
        <DualPane.ContentPane>
          <ErrorSection {...props} />
        </DualPane.ContentPane>
      </DualPane>
    </Screen>
  );
}

export default ErrorScreen;
