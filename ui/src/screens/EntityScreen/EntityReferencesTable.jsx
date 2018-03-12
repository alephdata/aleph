import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import SectionLoading from 'src/components/common/SectionLoading';
import Property from './Property';
import ensureArray from 'src/util/ensureArray';

import './EntityReferencesTable.css';

class EntityReferencesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: {}
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    const { query } = this.props;
    this.props.queryEntities({ query });
  }

  render() {
    const { model, result, property } = this.props;
    const results = ensureArray(result.results);
    const counts = {};

    for (let res of results) {
      _.keys(res.properties).forEach((key) => {
        counts[key] = counts[key] ? counts[key] + 1 : 1;
      });
    }

    const columns = _.values(model.properties).filter((prop) => {
      if (prop.name === property.name || prop.caption) {
        return false;
      }
      return (
        (Array.isArray(model.featured) && model.featured.includes(prop.name))
        || !!counts[prop.name]
      );
    });

    columns.sort((a, b) =>  {
      return (counts[b.name] || 0) - (counts[a.name] || 0);
    });

    return (
      <section className="EntityReferencesTable">
        <h3>
          <Property.Reverse model={property} />
        </h3>
        <table className="data-table" style={{width: '100%'}}>
          <thead>
            <tr>
              {columns.map(prop => (
                <th key={prop.name} className={prop.type}>
                  <Property.Name model={prop} />
                </th>
              ))}
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
              </tr>
            ))}
          </tbody>
        </table>
        { result.isLoading && (
          <SectionLoading />
        )}
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, property } = ownProps;
  const context = {
    [`filter:properties.${property.name}`]: entity.id
  }
  const query = Query.fromLocation('search', {}, context, property.name);

  return {
    query: query,
    result: selectEntitiesResult(state, query),
    model: state.metadata.schemata[ownProps.schema]
  }
}

export default connect(mapStateToProps, { queryEntities })(EntityReferencesTable);
