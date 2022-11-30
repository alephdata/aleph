import { FC } from 'react';
import { Params, Navigate, useParams } from 'react-router-dom';

type Props = {
  to: string | ((params: Params) => string);
};

const LegacyRedirect: FC<Props> = ({ to }) => {
  const params = useParams();
  to = typeof to === 'string' ? to : to(params);
  return <Navigate replace to={to} />;
};

export default LegacyRedirect;
