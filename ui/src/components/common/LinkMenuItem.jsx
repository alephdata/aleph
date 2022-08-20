import { MenuItem2 as MenuItem } from '@blueprintjs/popover2';
import { useLinkClickHandler, useHref } from 'react-router-dom';

export default function LinkMenuItem({ to, ...props }) {
  const href = useHref(to);
  const clickHandler = useLinkClickHandler(to);

  return <MenuItem href={href} onClick={clickHandler} {...props} />;
}
