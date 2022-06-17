// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Spinner } from '@blueprintjs/core';

import './SectionLoading.scss';

const SectionLoading = (props = {}) => (
  <div className="SectionLoading">
    <div className="spinner">
      <Spinner {...props}/>
    </div>
  </div>
);

export default SectionLoading;
