import React from 'react';
import { IconRegistry } from '@alephdata/followthemoney';
import { Icon as BlueprintIcon } from '@blueprintjs/core';

/* eslint-disable no-underscore-dangle */
BlueprintIcon.prototype._render = BlueprintIcon.prototype.render;
BlueprintIcon.prototype._renderSvgPaths = BlueprintIcon.prototype.renderSvgPaths;
Object.assign(BlueprintIcon.prototype, {
  isInternal(iconName) {
    return !!IconRegistry.getIcon(iconName);
  },
  render() {
    if (this.isInternal(this.props.icon)) {
      Object.assign(BlueprintIcon, {
        SIZE_STANDARD: 25,
        SIZE_LARGE: 25,
      });
    }
    const renderedIcon = BlueprintIcon.prototype._render.apply(this);
    Object.assign(BlueprintIcon, {
      SIZE_STANDARD: 16,
      SIZE_LARGE: 20,
    });
    return renderedIcon;
  },
  renderSvgPaths: (pathsSize, iconName) => {
    const iconPaths = IconRegistry.getIcon(iconName);
    if (iconPaths) {
      return iconPaths.map(d => <path key={d} d={d} fillRule="evenodd" />);
    } return BlueprintIcon.prototype._renderSvgPaths(pathsSize, iconName);
  },
});
/* eslint-enable no-underscore-dangle */
