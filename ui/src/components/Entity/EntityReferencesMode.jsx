import _ from 'lodash';
import React from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import {
  selectEntitiesResult, selectSchema,
} from 'selectors';
import {
  Collection, Entity, ErrorSection, Property, QueryInfiniteLoad, Schema, Skeleton,
} from 'components/common';
import EntityProperties from 'components/Entity/EntityProperties';
import ensureArray from 'util/ensureArray';
import { queryEntities } from 'actions/index';
import EntityActionBar from './EntityActionBar';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
  },
  no_results: {
    id: 'entity.references.no_results',
    defaultMessage: 'No {schema} match this search.',
  },
  no_results_default: {
    id: 'entity.references.no_results_default',
    defaultMessage: 'No entities match this search.',
  },
  search_placeholder: {
    id: 'entity.references.search.placeholder',
    defaultMessage: 'Search in {schema}',
  },
  search_placeholder_default: {
    id: 'entity.references.search.placeholder_default',
    defaultMessage: 'Search entities',
  },
});


class EntityReferencesMode extends React.Component {
  constructor(props) {
    super(props);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  onSearchSubmit(queryText) {
    const { query, history, location } = this.props;
    const newQuery = query.set('q', queryText);
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  onExpand(entity) {
    const { expandedId, parsedHash, history, location } = this.props;
    parsedHash.expand = expandedId === entity.id ? undefined : entity.id;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  renderCell(prop, entity) {
    const { schema, isThing } = this.props;
    const propVal = <Property.Values prop={prop} values={entity.getProperty(prop.name)} translitLookup={entity.latinized} />;
    if (isThing && schema.caption.indexOf(prop.name) !== -1) {
      return (
        <td key={prop.name} className="entity">
          <Entity.Link entity={entity}>
            <Schema.Icon schema={entity.schema} className="left-icon"/>
            {propVal}
          </Entity.Link>
        </td>
      );
    }
    return (
      <td key={prop.name} className={prop.type.name}>
        {propVal}
      </td>
    );
  }

  renderRow(columns, entity) {
    const { isThing, expandedId, hideCollection } = this.props;
    const isExpanded = entity.id === expandedId;
    const expandIcon = isExpanded ? 'chevron-up' : 'chevron-down';

    const mainRow = (
      <tr key={entity.id} className={c('nowrap', { prefix: isExpanded })}>
        { !isThing && (
          <td className="expand">
            <Button onClick={() => this.onExpand(entity)} small minimal icon={expandIcon} />
          </td>
        )}
        {columns.map(prop => this.renderCell(prop, entity))}
        { !hideCollection && (
          <td key={entity.collection?.id}>
            <Collection.Link collection={entity.collection} />
          </td>
        )}
      </tr>
    );
    if (!isExpanded) {
      return mainRow;
    }
    const colSpan = hideCollection ? columns.length : columns.length + 1;
    return [
      mainRow,
      <tr key={`${entity.id}-expanded`}>
        <td />
        <td colSpan={colSpan}>
          <EntityProperties entity={entity} showMetadata={false} />
        </td>
      </tr>,
    ];
  }

  renderSkeleton(columns, idx) {
    const { isThing, hideCollection } = this.props;
    return (
      <tr key={idx} className='nowrap'>
        {!isThing && (
          <td className="expand">
            <Button disabled small minimal icon='chevron-down' />
          </td>
        )}
        {columns.map(c => <td key={c}><Skeleton.Text type="span" length={10} /></td>)}
        {!hideCollection && (
          <td key="collection">
            <Skeleton.Text type="span" length={20} />
          </td>
        )}
      </tr>
    );
  }

  render() {
    const {
      intl, reference, query, result, schema, isThing, hideCollection
    } = this.props;

    if (!reference) {
      return <ErrorSection icon="graph" title={intl.formatMessage(messages.no_relationships)} />;
    }
    const { property } = reference;
    const results = _.uniqBy(ensureArray(result.results), 'id');
    const columns = schema.getFeaturedProperties().filter(prop => prop.name !== property.name);
    const schemaLabel = reference.schema.plural.toLowerCase();
    const placeholder = schema.name === 'Thing'
      ? intl.formatMessage(messages.search_placeholder_default)
      : intl.formatMessage(messages.search_placeholder, { schemaLabel })
    const skeletonItems = [...Array(15).keys()];

    return (
      <section className="EntityReferencesTable">
        <EntityActionBar
          query={query}
          onSearchSubmit={this.onSearchSubmit}
          searchPlaceholder={placeholder}
        >
        </EntityActionBar>
        {result.total !== 0 && (
          <>
            <table className="data-table references-data-table">
              <thead>
                <tr>
                  {!isThing && (
                    <th key="expand" />
                  )}
                  {columns.map(prop => (
                    <th key={prop.name} className={prop.type}>
                      <Property.Name prop={prop} />
                    </th>
                  ))}
                  {!hideCollection && (
                    <th>
                      <FormattedMessage
                        id="xref.match_collection"
                        defaultMessage="Dataset"
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map(entity => this.renderRow(columns, entity))}
                {result.isPending && skeletonItems.map(idx => this.renderSkeleton(columns, idx))}
              </tbody>
            </table>
            <QueryInfiniteLoad
              query={query}
              result={result}
              fetch={this.props.queryEntities}
            />
          </>
        )}
        {result.total === 0 && (
          <ErrorSection
            icon={<Schema.Icon schema={reference.schema} className="left-icon" size={60} />}
            title={schema.name === 'Thing'
              ? intl.formatMessage(messages.no_results_default)
              : intl.formatMessage(messages.no_results, { schemaLabel })
            }
          />
        )}
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, reference, query } = ownProps;
  const parsedHash = queryString.parse(location.hash);
  const schema = selectSchema(state, reference.schema);
  return {
    schema,
    parsedHash,
    expandedId: parsedHash.expand,
    result: selectEntitiesResult(state, query),
    isThing: schema.isThing(),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(EntityReferencesMode);
