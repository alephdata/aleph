import React, { PureComponent } from 'react';

class TagIcon extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      icons: {
        names: 'fa-tags',
        identifiers: 'fa-id-card',
        emails: 'fa-envelope',
        phones: 'fa-phone',
        addresses: 'fa-home'
      }
    }
  }

  render() {
    const { field } = this.props,
          icon = this.state.icons[field] || 'fa-link';

    return (
      <i className={`fa fa-fw ${icon}`} title={field} />
    );
  }
}

class Tag extends PureComponent {
  static Icon = TagIcon;
}

export default Tag;
