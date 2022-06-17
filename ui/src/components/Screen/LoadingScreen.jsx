// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Spinner } from '@blueprintjs/core';

import Screen from 'components/Screen/Screen';

import './LoadingScreen.scss';

const LoadingScreen = props => (
  <Screen {...props}>
    <div className="LoadingScreen">
      <div className="spinner">
        <Spinner className="bp3-large" />
      </div>
    </div>
  </Screen>
);

export default LoadingScreen;
