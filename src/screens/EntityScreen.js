import React, { Component } from 'react';
import { connect } from 'react-redux';

import Article from '../panes/Article';
import { fetchEntity } from '../actions';
console.log(Article.InfoPane)
class Entity extends Component {
  render() {
    const { id, data: { entity } } = this.props;
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
    const { id, data } = this.props;
    if (data.entity === undefined) {
      this.props.fetchEntity(id);
    }
  }

  render() {
    return (
      <Entity {...this.props} />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const id = ownProps.match.params.id;
  const entity = id !== undefined ? state.entityCache[id] : undefined;
  return { id, data: { entity } };
}

export default connect(mapStateToProps, { fetchEntity })(EntityLoader);
