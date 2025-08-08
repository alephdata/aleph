import React, { Component, PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import c from 'classnames';
import { Entity as VLEntity } from '/src/react-ftm/index.ts';

import withRouter from '/src/app/withRouter.jsx';
import EntitySelect from '/src/components/common/EntitySelect';
import togglePreview from '/src/util/togglePreview.js';
import { fetchEntity } from '/src/actions/index.js';
import { selectEntity } from '/src/selectors.js';
import getEntityLink from '/src/util/getEntityLink.js';

import './Entity.scss';

class EntityLink extends PureComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const {
      entity,
      navigate,
      location,
      preview,
      previewQueryText,
      profile = true,
    } = this.props;
    const modifierPressed =
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

    if (!preview || modifierPressed) {
      return;
    }

    event.preventDefault();
    togglePreview(navigate, location, entity, profile, previewQueryText);
  }

  render() {
    const { entity, className, children, preview, profile = true } = this.props;
    const content = children || <VLEntity.Label {...this.props} />;
    const link = getEntityLink(entity, profile);
    if (!link) {
      return content;
    }
    // const profileClass = entity.profileId ? 'profile' : undefined;
    return (
      <Link
        to={link}
        onClick={preview ? this.onClick : undefined}
        className={c('EntityLink', className, { visited: !!entity.lastViewed })}
      >
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
    const { id, entity } = this.props;
    if (entity.shouldLoad) {
      this.props.fetchEntity({ id });
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

  static Load = connect(mapStateToProps, { fetchEntity })(EntityLoad);

  static Select = EntitySelect;
}

export default Entity;
