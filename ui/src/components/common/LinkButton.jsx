import { AnchorButton } from '@blueprintjs/core';
import { useLinkClickHandler, useHref } from 'react-router-dom';

export default function LinkButton({ to, ...props }) {
  const href = useHref(to);
  const clickHandler = useLinkClickHandler(to);

  return <AnchorButton href={href} onClick={clickHandler} {...props} />;
}
