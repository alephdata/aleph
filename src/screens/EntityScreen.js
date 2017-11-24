import React, { Component } from 'react';
import { connect } from 'react-redux';

import Article from '../components/Article';
import { fetchEntity } from '../actions';

class Entity extends Component {
  render() {
    const { data: { entity } } = this.props;
    if (entity === undefined || entity._isFetching) {
      return (
        <span>Loading entity..</span>
      );
    }
    return (
      <Article>
        <Article.InfoPane>
          <h1>{entity.name}</h1>
          <ul>
            <li>{entity.schema}</li>
            <li>{entity.created_at}</li>
            <li>{entity.countries.join(', ')}</li>
          </ul>
        </Article.InfoPane>
        <Article.ContentPane>
          <dl>
            {Object.entries(entity.properties).map(([property, values]) => ([
              <dt>{property}</dt>,
              <dd>
                {values.length === 1
                  ? values[0]
                  : (
                    <ul>
                      {values.map(value => (
                        <li>{value}</li>
                      ))}
                    </ul>
                  )
                }
              </dd>
            ]))}
          </dl>
        </Article.ContentPane>
      </Article>
    );
  }
}

class EntityLoader extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entityId, data } = this.props;
    if (data.entity === undefined) {
      this.props.fetchEntity(entityId);
    }
  }

  render() {
    return (
      <Entity {...this.props} />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const entity = entityId !== undefined ? state.entityCache[entityId] : undefined;
  return { entityId, data: { entity } };
}

export default connect(mapStateToProps, { fetchEntity })(EntityLoader);
