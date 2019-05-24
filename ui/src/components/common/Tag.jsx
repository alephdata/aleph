import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core/lib/esm/components/icon/icon';

import './Tag.scss';

class TagIcon extends PureComponent {
  className='tag-icon';

  icons = {
    /* *
    * TODO: Fix this implementation once phones, addresses ann link icons will be available
    * */
    names: <Icon icon="tags" className={this.className} />,
    identifiers: <Icon icon="license" className={this.className} />,
    emails: <Icon icon="email" className={this.className} />,
    phones: <Icon icon="phone" className={this.className} />,
    addresses: <Icon icon="home" className={this.className} />,
    link: <Icon icon="link" className={this.className} />,
  };

  render() {
    const { field } = this.props;
    return this.icons[field] || this.icons.link;
  }
}

class Tag {
  static Icon = TagIcon;
}

export default Tag;
