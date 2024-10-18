import { FC } from 'react';

import { Loading, SomethingIsWrong, HappyPath } from './';

import PageState from '../utils/PageState';

interface Props {
  pageState: PageState;
  pinnedMessage: any;
  dismissMessage: any;
}

const Page: FC<Props> = ({ pageState, pinnedMessage, dismissMessage }) => {
  let render = null;

  switch (pageState) {
    case PageState.Success:
      render = (
        <HappyPath
          pinnedMessage={pinnedMessage}
          dismissMessage={dismissMessage}
        />
      );
      break;
    case PageState.Loading:
      render = <Loading />;
      break;
    case PageState.SomethingIsWrong:
      render = <SomethingIsWrong />;
      break;
  }

  return <>{render}</>;
};
export default Page;
