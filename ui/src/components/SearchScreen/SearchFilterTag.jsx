import React, { PureComponent } from 'react';
import { Tag as TagWidget } from '@blueprintjs/core';

import Tag from 'src/components/common/Tag';
import Country from 'src/components/common/Country';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/EntityScreen/Entity';

import './SearchFilterTag.css';


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
      case 'ancestors':
      case 'parent.id':
        return [
          'inside: ',
          <Entity.LabelById id={value} icon />
        ];
      case 'entities':
        return [
          'related: ',
          <Entity.LabelById id={value} icon />
        ];
      case 'names':
      case 'identifiers':
      case 'emails':
      case 'phones':
      case 'addresses':
        return (
          [<Tag.Icon field={filter} />, value]
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
        <TagWidget
          className="pt-large SearchFilterTag"
          onRemove={this.onRemove}
        >
          {this.label(filter, value)}
        </TagWidget>
    );
  }
}

export default SearchFilterTag;
