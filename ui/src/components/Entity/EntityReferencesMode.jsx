import React from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import {
  selectEntitiesResult, selectEntityReference, selectSchema,
} from 'src/selectors';
import {
  ErrorSection, SectionLoading, Entity,
} from 'src/components/common';
import EntityProperties from 'src/components/Entity/EntityProperties';
import Property from 'src/components/Property';
import ensureArray from 'src/util/ensureArray';
import { queryEntities } from 'src/actions/index';
import { queryEntityReference } from 'src/queries';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
  },
});


class EntityReferencesMode extends React.Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
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

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { reference, query, result } = this.props;
    if (reference && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  renderCell(prop, entity) {
    const { schema, isThing } = this.props;
    console.log('rendering cell', prop, entity.getProperty(prop));
    let content = <Property.Values prop={prop} values={entity.getProperty(prop)} />;
    if (isThing && schema.caption.indexOf(prop.name) !== -1) {
      content = <Entity.Link entity={entity}>{content}</Entity.Link>;
    }
    return (
      <td key={prop.name} className={prop.type.name}>
        {content}
      </td>
    );
  }

  renderRow(columns, entity) {
    const { isThing, expandedId } = this.props;
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
      </tr>
    );
    if (!isExpanded) {
      return mainRow;
    }
    return [
      mainRow,
      <tr key={`${entity.id}-expanded`}>
        <td />
        <td colSpan={columns.length}>
          <EntityProperties entity={entity} />
        </td>
      </tr>,
    ];
  }

  render() {
    const {
      intl, reference, result, schema, isThing,
    } = this.props;

    console.log('in REF MODE', this.props);
    if (!reference) {
      return <ErrorSection icon="graph" title={intl.formatMessage(messages.no_relationships)} />;
    }
    const { property } = reference;
    const results = ensureArray(result.results);
    const columns = schema.getFeaturedProperties().filter(prop => prop.name !== property.name);
    return (
      <section className="EntityReferencesTable">
        <table className="data-table references-data-table">
          <thead>
            <tr>
              { !isThing && (
                <th key="expand" />
              )}
              {columns.map(prop => (
                <th key={prop.name} className={prop.type}>
                  <Property.Name prop={prop} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(entity => this.renderRow(columns, entity))}
          </tbody>
        </table>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        { result.isLoading && (
          <SectionLoading />
        )}
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, mode, location } = ownProps;
  const parsedHash = queryString.parse(ownProps.location.hash);
  const reference = selectEntityReference(state, entity.id, mode);
  if (!reference) {
    return {};
  }
  const query = queryEntityReference(location, entity, reference);
  const schema = selectSchema(state, reference.schema);
  return {
    reference,
    query,
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
