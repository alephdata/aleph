// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core/lib/esm/components/icon/icon';

import './Tag.scss';

class TagIcon extends PureComponent {
  className='tag-icon';

  icons = {
    names: <Icon icon="tag" className={this.className} />,
    identifiers: <Icon icon="id-number" className={this.className} />,
    emails: <Icon icon="envelope" className={this.className} />,
    ibans: <Icon icon="bank-account" className={this.className} />,
    checksums: <Icon icon="barcode" className={this.className} />,
    ips: <Icon icon="ip-address" className={this.className} />,
    phones: <Icon icon="phone" className={this.className} />,
    addresses: <Icon icon="home" className={this.className} />,
    link: <Icon icon="link" className={this.className} />,
  };

  render() {
    const { field } = this.props;
    if (field === 'urls') { return null; }
    return this.icons[field] || this.icons.link;
  }
}

class Tag {
  static Icon = TagIcon;
}

export default Tag;
