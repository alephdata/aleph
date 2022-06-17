// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import './TextLoading.scss';


export default class TextLoading extends PureComponent {
  render() {
    const { loading, children } = this.props;
    if (loading) {
      return (
        <span className="TextLoading">
          <FormattedMessage id="text.loading" defaultMessage="Loading…" />
        </span>
      );
    }
    return children;
  }
}
