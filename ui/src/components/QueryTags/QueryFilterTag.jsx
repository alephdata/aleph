import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tag as TagWidget } from '@blueprintjs/core';

import {
  Schema, Tag, Country, Language, Category, Collection, Date, Entity,
} from 'src/components/common';

import './QueryFilterTag.scss';


class QueryFilterTag extends PureComponent {
  constructor(props) {
    super(props);
    this.onRemove = this.onRemove.bind(this);
  }

  onRemove() {
    const { filter, value, remove } = this.props;
    remove(filter, value);
  }

  label = (filter, value) => {
    switch (filter) {
      case 'schema':
        return (
          <Schema.Label schema={value} icon plural />
        );
      case 'countries':
        return (
          <Country.Name code={value} />
        );
      case 'languages':
        return (
          <Language.Name code={value} />
        );
      case 'category':
        return (
          <Category.Label category={value} />
        );
      case 'collection_id':
        return (
          <Collection.Load id={value} renderWhenLoading="…">
            {collection => (
              <Collection.Link collection={collection} />
            )}
          </Collection.Load>
        );
      case 'team_id':
      case 'creator_id':
      case 'uploader_id':
        return (
          <FormattedMessage id="search.filterTag.role" defaultMessage="Filter by access" />
        );
      case 'ancestors':
      case 'parent.id':
        return (
          <Entity.Load id={value} renderWhenLoading="…">
            {entity => (
              <>
                <FormattedMessage id="search.filterTag.ancestors" defaultMessage="in:" />
                <Entity.Label entity={entity} icon />
              </>
            )}
          </Entity.Load>
        );
      case 'exclude':
        return (
          <Entity.Load id={value} renderWhenLoading="…">
            {entity => (
              <>
                <FormattedMessage id="search.filterTag.exclude" defaultMessage="not:" />
                <Entity.Label entity={entity} icon />
              </>
            )}
          </Entity.Load>
        );
      case 'entities':
        return (
          <Entity.Load id={value} renderWhenLoading="…">
            {entity => (
              <Entity.Label entity={entity} icon />
            )}
          </Entity.Load>
        );
      case 'names':
      case 'identifiers':
      case 'emails':
      case 'phones':
      case 'addresses':
        return (
          <>
            <Tag.Icon field={filter} />
            {value}
          </>
        );
      case 'eq:dates':
        return (
          <>
            <Date value={value.replace('||/y', '')} />
          </>
        );
      case 'lte:dates':
        return (
          <>
            <FormattedMessage id="search.filterTag.dates_before" defaultMessage="Before " />
            <Date value={value.replace('||/y', '')} />
          </>
        );
      case 'gte:dates':
        return (
          <>
            <FormattedMessage id="search.filterTag.dates_after" defaultMessage="After " />
            <Date value={value.replace('||/y', '')} />
          </>
        );
      default:
        return value;
    }
  }

  render() {
    const { filter, value } = this.props;

    return (
      <TagWidget
        large
        className="QueryFilterTag"
        onRemove={this.onRemove}
      >
        {this.label(filter, value)}
      </TagWidget>
    );
  }
}

export default QueryFilterTag;
