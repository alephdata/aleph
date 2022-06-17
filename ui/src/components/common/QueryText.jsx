// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';

import './QueryText.scss';


class QueryText extends PureComponent {
  render() {
    const { query } = this.props;
    return <span className="QueryText">{query}</span>;
  }
}

export default QueryText;
