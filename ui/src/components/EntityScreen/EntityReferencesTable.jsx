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
  constructor(props) {
    super(props);
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
    const { model, property } = this.props;
    const { result, isFetching } = this.state;
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
        <table className="pt-html-table pt-html-table-bordered">
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
