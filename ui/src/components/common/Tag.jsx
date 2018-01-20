import React, {Component} from 'react';

class TagIcon extends Component {
  constructor() {
    super();
    this.state = {
      icons: {
        names: 'fa-tags',
        identifiers: 'fa-id-card',
        emails: 'fa-envelope',
        phones: 'fa-phone',
        addresses: 'fa-house'
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.field !== nextProps.field;
  }

  render() {
    const { field } = this.props,
          icon = this.state.icons[field] || 'fa-link';

    return (
      <i className={`fa fa-fw ${icon}`}/>
    );
  }
}

class Tag extends Component {
  static Icon = TagIcon;
}

export default Tag;
