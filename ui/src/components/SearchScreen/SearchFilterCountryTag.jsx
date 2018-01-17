import React, { PureComponent } from 'react';
import { Tag } from '@blueprintjs/core';

import Country from 'src/components/common/Country';

class SearchFilterCountryTag extends PureComponent {
  render() {
    const { countryCode, removeCountry } = this.props;
    return (
      <Tag
        className="pt-large"
        onRemove={() => removeCountry(countryCode)}
      >
        <Country.Name code={countryCode} />
      </Tag>
    );
  }
}

export default SearchFilterCountryTag;
