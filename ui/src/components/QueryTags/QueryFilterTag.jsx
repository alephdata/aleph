import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, Tag as TagWidget } from '@blueprintjs/core';
import { cleanDateQParam } from 'components/Facet/util';

import {
  Schema, Tag, Country, Language, Category, Collection, Date, Entity,
} from 'components/common';

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

  label = (filter, type, value) => {
    switch (type || filter) {
      case 'schema':
        return (
          <Schema.Label schema={value} icon plural />
        );
      case 'country':
      case 'countries':
        return (
          <Country.Name code={value} />
        );
      case 'language':
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
          <Collection.Load id={value}>
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
      case 'entity':
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
      case 'lte:dates':
      case 'gte:dates':
      case 'date':
        let prefix;
        if (filter.includes('gte')) {
          prefix = <FormattedMessage id="search.filterTag.dates_after" defaultMessage="After " />
        } else if (filter.includes('lte')) {
          prefix = <FormattedMessage id="search.filterTag.dates_before" defaultMessage="Before " />
        }

        return (
          <>
            <Icon icon="calendar" className="left-icon" />
            {prefix}
            <Date value={cleanDateQParam(value)} />
          </>
        );
      default:
        return value;
    }
  }

  render() {
    const { filter, type, value } = this.props;

    return (
      <TagWidget
        large
        className="QueryFilterTag"
        onRemove={this.onRemove}
      >
        {this.label(filter, type, value)}
      </TagWidget>
    );
  }
}

export default QueryFilterTag;
