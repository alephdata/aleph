import React, { PureComponent } from 'react';
import { Tag } from '@blueprintjs/core';

import Country from 'src/components/common/Country';

class SearchFilterCountryTag extends PureComponent {
  constructor(props) {
    super(props);
    this.onRemove = this.onRemove.bind(this);
  }

  onRemove() {
    const { countryCode, removeCountry } = this.props;
    removeCountry(countryCode);
  }

  render() {
    const { countryCode } = this.props;
    return (
      <Tag
        className="pt-large"
        onRemove={this.onRemove}
      >
        <Country.Name code={countryCode} />
      </Tag>
    );
  }
}

export default SearchFilterCountryTag;
