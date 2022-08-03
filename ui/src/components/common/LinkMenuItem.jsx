import { MenuItem } from '@blueprintjs/core';
import { useLinkClickHandler, useHref } from 'react-router-dom';

export default function LinkMenuItem({ to, ...props }) {
  const href = useHref(to);
  const clickHandler = useLinkClickHandler(to);

  return <MenuItem href={href} onClick={clickHandler} {...props} />;
}
