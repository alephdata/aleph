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
  ErrorSection, Property, SectionLoading, SearchBox,
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

  render() {
    const {
      intl, reference, result, schema,
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
              <th key="details" className="narrow" />
            </tr>
          </thead>
          <tbody>
            {results.map(entity => (
              <tr key={entity.id}>
                {columns.map(prop => (
                  <td key={prop.name} className={prop.type}>
                    <Property.Values
                      prop={prop}
                      values={entity.getProperty(prop)}
                    />
                  </td>
                ))}
                <td key="details" className="narrow">
                  <a href={getEntityLink(entity)} onClick={e => this.onShowDetails(e, entity)}>
                    <span>
                      <FormattedMessage id="references.details" defaultMessage="Details" />
                    </span>
                  </a>
                </td>
              </tr>
            ))}
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
  return {
    reference,
    query,
    result: selectEntitiesResult(state, query),
    schema: selectSchema(state, reference.schema),
  };
};

const mapDispatchToProps = { queryEntities };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityReferencesMode);
