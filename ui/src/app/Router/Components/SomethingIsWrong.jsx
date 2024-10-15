import { FormattedMessage } from 'react-intl';

const SomethingIsWrong = () => (
  <div className="RouterLoading">
    <FormattedMessage
      id="somethingIsWrong"
      defaultMessage="Something is wrong, please try again later"
    />
  </div>
);

export default SomethingIsWrong;
