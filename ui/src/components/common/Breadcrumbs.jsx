import React, { PureComponent, Component } from 'react';
import { connect } from 'react-redux';
import { selectEntity } from 'src/selectors';
import { fetchEntity } from 'src/actions';
import { Collection, Entity } from 'src/components/common';
import './Breadcrumbs.scss';


class CollectionBreadcrumb extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <li key={collection.id}>
        <Collection.Link collection={collection} className="bp3-breadcrumb" icon truncate={30} />
      </li>
    );
  }
}


class EntityBreadcrumb extends PureComponent {
  fetchIfNeeded([id, entity]) {
    if (entity.shouldLoad) {
      return !this.props.fetchEntity({ id });
    } return !entity.isLoading;
  }

  render() {
    const { entity } = this.props;
    return (
      <React.Fragment>
        {this.props.parents
          .filter(parent => this.fetchIfNeeded(parent))
          .map(parent => <Breadcrumbs.Entity key={parent[0]} entity={parent[1]} />)
        }
        <li key={entity.id}>
          <Entity.Link entity={entity} className="bp3-breadcrumb" icon truncate={30} />
        </li>
      </React.Fragment>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const { text } = this.props;
    if (!text) {
      return null;
    }
    return (
      <li key="text">
        <span className="bp3-breadcrumb bp3-breadcrumb-current">{text}</span>
      </li>
    );
  }
}
const mapStateToProps = (state, { entity, discovery = true }) => {
  let parents = [];
  if (entity.schema.hasProperty('parent') && discovery) {
    parents = entity.getProperty('parent').values
      .map(parent => [parent.id, selectEntity(state, parent.id)]);
  }
  return ({
    parents,
  });
};

export default class Breadcrumbs extends Component {
  static Collection = CollectionBreadcrumb;

  static Entity = connect(mapStateToProps, { fetchEntity })(EntityBreadcrumb);

  static Text = TextBreadcrumb;

  render() {
    const { collection, children, operation } = this.props;

    const collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="bp3-breadcrumbs">
          {collectionCrumbs}
          {children}
        </ul>
        {operation}
      </nav>
    );
  }
}
