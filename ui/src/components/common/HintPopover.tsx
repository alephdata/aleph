import { FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';
import {
  Popover2 as Popover,
  Classes,
  IPopover2Props,
} from '@blueprintjs/popover2';

import { selectDismissedHints } from 'selectors';
import { dismissHint } from 'actions';

import './HintPopover.scss';

type HintPopoverProps = {
  id: string;
  content: IPopover2Props['content'];
};

const HintPopover: FC<HintPopoverProps> = ({ id, content, children }) => {
  const dispatch = useDispatch();
  const dismissedHints = useSelector(selectDismissedHints);
  const isOpen = !dismissedHints.includes(id);

  return (
    <Popover
      isOpen={isOpen}
      hasBackdrop
      backdropProps={{ className: 'HintPopover__backdrop' }}
      popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
      content={
        <>
          {content}
          <Button fill onClick={() => dispatch(dismissHint(id))}>
            <FormattedMessage
              id="hint_popover.dismiss"
              defaultMessage="Don’t show this again"
            />
          </Button>
        </>
      }
    >
      {children}
    </Popover>
  );
};

export default HintPopover;
