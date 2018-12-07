import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import Waypoint from 'react-waypoint';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';

import Query from 'src/app/Query';
import {queryEntities} from 'src/actions/index';
import {selectEntitiesResult, selectEntityReference, selectSchemata} from "src/selectors";
import {ErrorSection, Property, SectionLoading} from 'src/components/common';
import ensureArray from 'src/util/ensureArray';
import togglePreview from 'src/util/togglePreview';

const messages = defineMessages({
  no_relationships: {
    id: 'entity.references.no_relationships',
    defaultMessage: 'This entity does not have any relationships.',
  }
});


class EntityReferencesMode extends React.Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { reference, query, result } = this.props;
    if (reference && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  onShowDetails(event, entity) {
    const { history } = this.props;
    event.preventDefault();
    togglePreview(history, entity, 'entity');
  }

  render() {
    const { intl, reference, result, model } = this.props;
    if (!reference) {
      return <ErrorSection visual="graph" title={intl.formatMessage(messages.no_relationships)} />;
    }
    const { property } = reference;
    const results = ensureArray(result.results);
    const columns = model.getFeaturedProperties()
      .filter((prop) => {
        return prop.name !== property.name && !prop.caption;
      });

    return (
      <section key={property.qname} className="EntityReferencesTable">
        <table key={property.qname} className="data-table references-data-table">
          <thead>
            <tr key={property.qname}>
              {columns.map(prop => (
                <th key={prop.name} className={prop.type}>
                  <Property.Name model={prop} />
                </th>
              ))}
              <th key="details" className="narrow"/>
            </tr>
          </thead>
          <tbody>
            {results.map((entity) => (
              <tr key={entity.id}>
                {columns.map(prop => (
                  <td key={prop.name} className={prop.type}>
                    <Property.Values model={prop} values={entity.properties[prop.name]} />
                  </td>
                ))}
                <td key="details" className="narrow">
                  <a onClick={(e) => this.onShowDetails(e, entity)} href="#">
                    <span>
                      <FormattedMessage id="references.details" defaultMessage="Details" />
                    </span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Waypoint onEnter={this.getMoreResults}
                  bottomOffset="-300px"
                  scrollableAncestor={window} />
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
    [`filter:properties.${reference.property.name}`]: entity.id
  };
  const query = Query.fromLocation('entities', location, context, reference.property.name);
  return {
    reference, query,
    result: selectEntitiesResult(state, query),
    model: selectSchemata(state)[reference.schema]
  };
};

EntityReferencesMode = connect(mapStateToProps, { queryEntities })(EntityReferencesMode);
EntityReferencesMode = withRouter(EntityReferencesMode);
EntityReferencesMode = injectIntl(EntityReferencesMode);
export default EntityReferencesMode;