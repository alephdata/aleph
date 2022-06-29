{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';

import SinglePane from 'components/common/SinglePane';
import ErrorSection from 'components/common/ErrorSection';
import Screen from 'components/Screen/Screen';


function ErrorScreen(props) {
  const { title = '', error } = props;
  const screenTitle = error === undefined ? title : error.message;

  return (
    <Screen title={screenTitle}>
      <SinglePane>
        <ErrorSection {...props} />
      </SinglePane>
    </Screen>
  );
}

export default ErrorScreen;
