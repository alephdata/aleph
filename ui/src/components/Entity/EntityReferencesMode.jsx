import React from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions/index';
import { selectEntitiesResult, selectEntityReference, selectSchemata } from 'src/selectors';
import { ErrorSection, Property, SectionLoading } from 'src/components/common';
import ensureArray from 'src/util/ensureArray';
import togglePreview from 'src/util/togglePreview';
import { enhancer } from '../../screens/OAuthScreen/enhancers';
import getPath from '../../util/getPath';

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
      intl, reference, result, model,
    } = this.props;
    if (!reference) {
      return <ErrorSection visual="graph" title={intl.formatMessage(messages.no_relationships)} />;
    }
    const { property } = reference;
    const results = ensureArray(result.results);
    const columns = model.getFeaturedProperties()
      .filter(prop => prop.name !== property.name && !prop.caption);

    return (
      <section className="EntityReferencesTable">
        <table className="data-table references-data-table">
          <thead>
            <tr>
              {columns.map(prop => (
                <th key={prop.name} className={prop.type}>
                  <Property.Name model={prop} />
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
                    <Property.Values model={entity.getProperty(prop.name)} />
                  </td>
                ))}
                <td key="details" className="narrow">
                  <a href={getPath(entity.links.ui)} onClick={e => this.onShowDetails(e, entity)}>
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
    model: selectSchemata(state).getSchema(reference.schema),
  };
};


export default enhancer({
  mapStateToProps,
  mapDispatchToProps: { queryEntities },
})(EntityReferencesMode);
