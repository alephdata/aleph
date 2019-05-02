import React from 'react';
import { IconRegistry } from '@alephdata/followthemoney';
import { Icon as BlueprintIcon } from '@blueprintjs/core';


class Icon extends BlueprintIcon {
  renderSvgPaths = (pathsSize, iconName) => IconRegistry.getIcon(iconName)
    .map(d => <path key={d} d={d} fillRule="evenodd" />);
}

export { Icon };
export default Icon;
