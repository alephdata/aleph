import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tag as TagWidget } from '@blueprintjs/core';

import Schema from 'src/components/common/Schema';
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
      case 'schema':
        return (
          <Schema.Label schema={value} icon={true} plural={true} />
        );
      case 'countries':
        return (
          <Country.Name code={value} />
        );
      case 'collection_id':
        return (
          <Collection.Load id={value} renderWhenLoading={'…'}>{collection => (
            <Collection.Label collection={collection} />
          )}</Collection.Load>
        );
      case 'ancestors':
      case 'parent.id':
        return (
          <span>
            <FormattedMessage id="search.filterTag.ancestors" defaultMessage="inside:" />
            <Entity.Load id={value} renderWhenLoading={'…'}>{entity => (
              <Entity.Label entity={entity} icon />
            )}</Entity.Load>
          </span>
        );
      case 'entities':
        return (
          <span>
            <FormattedMessage id="search.filterTag.entities" defaultMessage="related:" />
            <Entity.Load id={value} renderWhenLoading={'…'}>{entity => (
              <Entity.Label entity={entity} icon />
            )}</Entity.Load>
          </span>
        );
      case 'names':
      case 'identifiers':
      case 'emails':
      case 'phones':
      case 'addresses':
        return (
          <span><Tag.Icon field={filter} /> {value}</span>
        );
      default:
        return (
          <span><i>{filter}</i>: {value}</span>
        );
    }
  }

  render() {
    const { filter, value } = this.props;
    return (
        <TagWidget
          className="pt-large pt-minimal SearchFilterTag"
          onRemove={this.onRemove}>
          {this.label(filter, value)}
        </TagWidget>
    );
  }
}

export default SearchFilterTag;
