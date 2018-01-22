import React, { PureComponent } from 'react';
import { Tag } from '@blueprintjs/core';

import Country from 'src/components/common/Country';
import Collection from 'src/components/common/Collection';


class SearchFilterTag extends PureComponent {
  constructor(props) {
    super(props);
    this.onRemove = this.onRemove.bind(this);
  }

  onRemove() {
    const { filter, value, remove } = this.props;
    remove(filter, value);
  }
  
  label(filter, value) {
    switch (filter) {
      case 'countries':
        return (
          <Country.Name code={value} />
        );
      case 'collection_id':
        return (
          <Collection.LabelById id={value} />
        );
      default:
        return (
          <div><i>{filter}</i>: {value}</div>
        );
    }
  }

  render() {
    const { filter, value } = this.props;
    return (
      <Tag
        className="pt-large"
        onRemove={this.onRemove}
      >
        {this.label(filter, value)}
      </Tag>
    );
  }
}

export default SearchFilterTag;
