// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
