import React, { Component, PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';
import { Entity as VLEntity } from '@alephdata/react-ftm';

import EntitySelect from 'src/components/common/EntitySelect';
import togglePreview from 'src/util/togglePreview';
import { fetchEntity as fetchEntityAction } from 'src/actions';
import { selectEntity } from 'src/selectors';
import getEntityLink from 'src/util/getEntityLink';

import './Entity.scss';

class EntityLink extends PureComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const { entity, history, preview } = this.props;
    if (preview) {
      event.preventDefault();
      togglePreview(history, entity);
    }
  }

  render() {
    const { entity, className, children, preview } = this.props;
    const content = children || <VLEntity.Label {...this.props} />;
    const link = getEntityLink(entity);
    if (!link) {
      return content;
    }
    return (
      <Link to={link} onClick={preview ? this.onClick : undefined} className={c('EntityLink', className)}>
        {content}
      </Link>
    );
  }
}


class EntityLoad extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { id, entity, fetchEntity } = this.props;
    if (entity.shouldLoad) {
      fetchEntity({ id });
    }
  }

  render() {
    const { entity, children, renderWhenLoading } = this.props;
    if (entity.isPending && renderWhenLoading !== undefined) {
      return renderWhenLoading;
    }
    return children(entity);
  }
}

const mapStateToProps = (state, ownProps) => ({
  entity: selectEntity(state, ownProps.id),
});

class Entity {
  static Label = VLEntity.Label;

  static Link = withRouter(EntityLink);

  static Load = connect(mapStateToProps, { fetchEntity: fetchEntityAction })(EntityLoad);

  static Select = EntitySelect;
}

export default Entity;
