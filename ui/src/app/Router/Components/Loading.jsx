import { Spinner, Classes } from '@blueprintjs/core';

const Loading = () => {
  return (
    <div className="RouterLoading">
      <div className="spinner">
        <Spinner className={Classes.LARGE} />
      </div>
    </div>
  );
};

export default Loading;
