import React from 'react';
import { Alignment, Classes, ButtonGroup, Button, Tooltip } from '@blueprintjs/core';
import c from 'classnames';

import './InvestigationSidebarButton.scss';

const InvestigationSidebarButton = ({ text, rightIcon, isCollapsed, ...rest }) => {
  return (
    <Tooltip
      disabled={!isCollapsed}
      content={<>{text}{typeof rightIcon !== 'string' && rightIcon}</>}
      position="right"
      popoverClassName="InvestigationSidebarButton__tooltip"
      modifiers={{
        preventOverflow: { enabled: false },
        flip: { enabled: false }
      }}
      fill
    >
      <Button
        className="InvestigationSidebarButton"
        fill
        text={!isCollapsed && text}
        rightIcon={!isCollapsed && rightIcon}
        alignText={Alignment.LEFT}
        {...rest}
      />
    </Tooltip>
  );
}

export default InvestigationSidebarButton;
