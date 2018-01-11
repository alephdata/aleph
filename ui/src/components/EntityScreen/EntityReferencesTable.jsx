import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { fetchSearchResults } from 'src/actions';
import SectionLoading from 'src/components/common/SectionLoading';
import Query from 'src/components/SearchScreen/Query';
import Property from './Property';
import ensureArray from 'src/util/ensureArray';

import './EntityReferencesTable.css';

class EntityReferencesTable extends Component {
  constructor() {
    super();
    this.state = {
      result: {},
      isFetching: true
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
    this.setState({isFetching: true})
    const { query } = this.props;

    this.props.fetchSearchResults({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  render() {
    const { schema, model, property } = this.props;
    const { result, isFetching } = this.state;
    const results = ensureArray(result.results);
    const exists = {};

    for (let res of results) {
      _.keys(res.properties).forEach((key) => {
        exists[key] = true;
      });
    }

    const columns = Object.values(model.properties).filter((prop) => {
      if (prop.name === property.name) {
        return false;
      }
      return !!exists[prop.name];
    });

    return (
      <section className="EntityReferencesTable">
        <h3>
          {property.reverse}
        </h3>
        <table>
          <thead>
            <tr>
              {columns.map(prop => (
                <th key={prop.name}>
                  <Property.Name model={prop} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((entity) => (
              <tr key={entity.id}>
                {columns.map(prop => (
                  <td key={prop.name}>
                    <Property.Values model={prop} values={entity.properties[prop.name]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        { isFetching && (
          <SectionLoading />
        )}
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, property } = ownProps;
  const filterName = `filter:properties.${property.name}`;
  const query = Query.fromLocation({}, {
    [filterName]: entity.id
  });

  return {
    query: query,
    model: state.metadata.schemata[ownProps.schema]
  }
}

export default connect(mapStateToProps, { fetchSearchResults })(EntityReferencesTable);
