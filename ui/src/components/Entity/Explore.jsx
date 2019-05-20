import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  GraphConfig, GraphContext, GraphEditor, GraphLayout,
} from '@alephdata/vislib';
import { selectEntity, selectModel } from 'src/selectors';

export class Explore extends Component {
  config = new GraphConfig();

  constructor(props) {
    super(props);
    console.log('yeah');
    if (props.model) {
      this.state = { layout: this.computeLayout(props) };
      if (!props.entity.shouldLoad && !props.entity.isLoading) {
        this.state.layout = this.computeEntity(props.entity);
      }
    }


    this.updateLayout = this.updateLayout.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.model !== this.props.model) {
      this.setState({
        layout: this.computeLayout(nextProps),
      });
    }
    if (!nextProps.entity.shouldLoad && !nextProps.entity.isLoading && (
      nextProps.entity !== this.props.entity
    )) {
      this.updateLayout(this.computeEntity(nextProps.entity));
    }
  }

  computeEntity(entity) {
    this.state.layout.addEntity(entity);
    return this.state.layout;
  }

  computeLayout({ model } = this.props) {
    return new GraphLayout(this.config, model);
  }

  updateLayout(layout) {
    this.setState({ layout });
  }

  render() {
    const { layout } = this.state;
    return (
      <GraphContext.Provider value={{
        updateLayout: this.updateLayout,
        layout,
      }}
      >
        <GraphEditor layout={layout} updateLayout={this.updateLayout} />
      </GraphContext.Provider>
    );
  }
}
const mapStateToProps = (state, { entityId }) => ({
  model: selectModel(state),
  entity: selectEntity(state, entityId),
});
export default connect(mapStateToProps)(Explore);
