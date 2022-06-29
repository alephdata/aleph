{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { IconRegistry } from '@alephdata/followthemoney';
import { Icon as BlueprintIcon } from '@blueprintjs/core';

const FTM_ICON_SIZE = IconRegistry.SIZE;

/* eslint-disable no-underscore-dangle */
const renderSvgPaths = (pathsSize, iconName) => {
  const iconPaths = IconRegistry.getIcon(iconName);
  if (iconPaths) {
    return (
      <g transform={`scale(${pathsSize/FTM_ICON_SIZE})`}>
        {iconPaths.map(d => <path key={d} d={d} fillRule="evenodd" />)}
      </g>
    );
  } return BlueprintIcon.prototype._renderSvgPaths(pathsSize, iconName);
};

// extends blueprint icon renderer to render icons from the ftm iconRegistry
export default function initializeIconRenderer() {
  if (!BlueprintIcon.prototype._render) {
    BlueprintIcon.prototype._render = BlueprintIcon.prototype.render;
  }
  if (!BlueprintIcon.prototype._renderSvgPaths) {
    BlueprintIcon.prototype._renderSvgPaths = BlueprintIcon.prototype.renderSvgPaths;
  }

  Object.assign(BlueprintIcon.prototype, {
    render() {
      return BlueprintIcon.prototype._render.apply(
        { ...this, renderSvgPaths },
      );
    },
  });
}

/* eslint-enable no-underscore-dangle */
