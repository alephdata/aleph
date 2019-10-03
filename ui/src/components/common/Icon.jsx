import React from 'react';
import { IconRegistry } from '@alephdata/followthemoney';
import { Icon as BlueprintIcon } from '@blueprintjs/core';

const defaultIconSize = BlueprintIcon.SIZE_STANDARD;

/* eslint-disable no-underscore-dangle */
const renderSvgPaths = (pathsSize, iconName) => {
  const iconPaths = IconRegistry.getIcon(iconName);
  if (iconPaths) {
    return iconPaths.map(d => <path key={d} d={d} fillRule="evenodd" />);
  } return BlueprintIcon.prototype._renderSvgPaths(pathsSize, iconName);
};

BlueprintIcon.prototype._render = BlueprintIcon.prototype.render;
BlueprintIcon.prototype._renderSvgPaths = BlueprintIcon.prototype.renderSvgPaths;

Object.assign(BlueprintIcon.prototype, {
  isInternal(iconName) {
    return !!IconRegistry.getIcon(iconName);
  },
  render() {
    const props = { ...this.props };

    if (this.isInternal(this.props.icon)) {
      // for internal icons, viewport needs to be 25 * 25, while svg dimensions
      //  should be set to standard blueprint size
      props.iconSize = props.iconSize || defaultIconSize;

      Object.assign(BlueprintIcon, {
        SIZE_STANDARD: 25,
        SIZE_LARGE: 25,
      });
    }
    const renderedIcon = BlueprintIcon.prototype._render.apply({ ...this, props, renderSvgPaths });
    Object.assign(BlueprintIcon, {
      SIZE_STANDARD: 16,
      SIZE_LARGE: 20,
    });
    return renderedIcon;
  },
});
/* eslint-enable no-underscore-dangle */
