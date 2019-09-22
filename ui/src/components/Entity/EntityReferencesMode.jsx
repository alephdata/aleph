import React from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { queryEntities } from 'src/actions/index';
import {
  selectEntitiesResult, selectEntityReference, selectSchema,
} from 'src/selectors';
import {
  ErrorSection, Property, SectionLoading, SearchBox, Entity,
} from 'src/components/common';
import ensureArray from 'src/util/ensureArray';
import togglePreview from 'src/util/togglePreview';
import getEntityLink from 'src/util/getEntityLink';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
  },
});


class EntityReferencesMode extends React.Component {
  static Search = function Search(props) {
    return (
      <div className="bp3-callout bp3-intent-primary">
        <SearchBox
          searchText={props.query.getString('q')}
          onSearch={(queryText) => {
            const { history } = props;
            history.push({
              pathname: props.location.pathname,
              search: props.query.setString('q', queryText).toLocation(),
              hash: props.location.hash,
            });
          }}
        />
      </div>

    );
  }

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

  onShowDetails(event, entity) {
    const { history } = this.props;
    event.preventDefault();
    togglePreview(history, entity, 'entity');
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
    let content = <Property.Values prop={prop} values={entity.getProperty(prop)} />;
    if (isThing && schema.caption.indexOf(prop.name) !== -1) {
      content = <Entity.Link entity={entity}>{content}</Entity.Link>;
    }
    return (
      <td key={prop.name} className={prop.type}>
        {content}
      </td>
    );
  }

  renderRow(columns, entity) {
    const { isThing } = this.props;
    return (
      <tr key={entity.id}>
        {columns.map(prop => this.renderCell(prop, entity))}
        { !isThing && (
          <td key="details" className="narrow">
            <a href={getEntityLink(entity)} onClick={e => this.onShowDetails(e, entity)}>
              <span>
                <FormattedMessage id="references.details" defaultMessage="Details" />
              </span>
            </a>
          </td>
        )}
      </tr>
    );
  }

  render() {
    const {
      intl, reference, result, schema, isThing,
    } = this.props;
    if (!reference) {
      return <ErrorSection icon="graph" title={intl.formatMessage(messages.no_relationships)} />;
    }
    const { property } = reference;
    const results = ensureArray(result.results);
    const isSearchable = reference.count > result.limit;
    const columns = schema.getFeaturedProperties().filter(prop => prop.name !== property.name);
    return (
      <section className="EntityReferencesTable">
        {isSearchable && (
          <EntityReferencesMode.Search
            query={this.props.query}
            history={this.props.history}
            location={this.props.location}
          />
        )}
        <table className="data-table references-data-table">
          <thead>
            <tr>
              {columns.map(prop => (
                <th key={prop.name} className={prop.type}>
                  <Property.Name prop={prop} />
                </th>
              ))}
              { !isThing && (
                <th key="details" className="narrow" />
              )}
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
  const reference = selectEntityReference(state, entity.id, mode);
  if (!reference) {
    return {};
  }
  const context = {
    [`filter:properties.${reference.property.name}`]: entity.id,
    'filter:schemata': reference.schema,
  };
  const query = Query.fromLocation('entities', location, context, reference.property.name);
  const schema = selectSchema(state, reference.schema);
  return {
    reference,
    query,
    schema,
    result: selectEntitiesResult(state, query),
    isThing: schema.isThing(),
  };
};

const mapDispatchToProps = { queryEntities };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityReferencesMode);
