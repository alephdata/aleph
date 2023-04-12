import { FC } from 'react';
import { connect } from 'react-redux';
import { AnchorButton, Button } from '@blueprintjs/core';
import { Popover2 as Popover, Classes } from '@blueprintjs/popover2';
import { setConfigValue } from 'actions/configActions';

import './FeedbackButton.scss';

type FeedbackButtonProps = {
  showMessage: boolean;
  setConfigValue: (payload: object) => void;
};

const FeedbackButton: FC<FeedbackButtonProps> = ({
  showMessage,
  setConfigValue,
}) => {
  const popoverContent = (
    <>
      <p>
        <strong>We have overhauled the timelines feature! 🎉</strong>
      </p>
      <p>
        It’s now easier to add items to a timeline and the new chart view allows
        you to visualize your data.
      </p>
      <p>
        There are still a few rough edges here and there. And we have a few more
        enhancements planned for the future.
      </p>
      <p>
        We’d love to hear your feedback. Is there something that would make
        timelines more useful to you? Click the link above to let us know.
      </p>
      <Button
        fill
        onClick={() => setConfigValue({ timelinesMessageDismissed: true })}
      >
        Don’t show this message again
      </Button>
    </>
  );

  return (
    <Popover
      placement="bottom"
      isOpen={showMessage}
      popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
      content={popoverContent}
    >
      <AnchorButton
        href="https://forms.gle/yU3bTKv2qG62AEBEA"
        target="_blank"
        minimal
        className="FeedbackButton"
      >
        <span className="FeedbackButton__text">Give Feedback</span>
      </AnchorButton>
    </Popover>
  );
};

const mapStateToProps = (state: any) => ({
  showMessage: !state.config.timelinesMessageDismissed,
});

export default connect(mapStateToProps, { setConfigValue })(FeedbackButton);
