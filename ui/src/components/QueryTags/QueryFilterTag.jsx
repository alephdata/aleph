// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, Tag as TagWidget } from '@blueprintjs/core';

import {
  Schema, Tag, Country, Language, Category, Collection, Entity,
} from 'components/common';

import './QueryFilterTag.scss';


class QueryFilterTag extends PureComponent {
  constructor(props) {
    super(props);
    this.onRemove = this.onRemove.bind(this);
  }

  onRemove() {
    const { filter, type, value, remove } = this.props;
    remove(filter, type, value);
  }

  label = (query, filter, type, value) => {
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
      case 'date':
        return (
          <>
            <Icon icon="calendar" className="left-icon" />
            {value}
          </>
        );
      default:
        return value;
    }
  }

  render() {
    const { filter, type, value, query } = this.props;

    return (
      <TagWidget
        large
        className="QueryFilterTag"
        onRemove={this.onRemove}
      >
        {this.label(query, filter, type, value)}
      </TagWidget>
    );
  }
}

export default QueryFilterTag;
