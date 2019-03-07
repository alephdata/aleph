import React from 'react';
import ReactSVG from 'react-svg';
import c from 'classnames';
import './Icon.scss';

const ICONS_PATH = '/icons/';

function Icon(props) {
  const {
    name,
    color,
    iconSize,
    style,
    className,
    ...otherProps
  } = props;
  const svgStyles = { ...style };
  if (color) {
    Object.assign(svgStyles, { color });
  }
  if (iconSize) {
    Object.assign(svgStyles, {
      width: iconSize,
      height: iconSize,
    });
  }
  return (
    <ReactSVG
      className={c('al-icon', className)}
      svgClassName="al-icon--svg"
      src={`${ICONS_PATH}${name}.svg`}
      svgStyle={svgStyles}
      {...otherProps}
    />
  );
}
export { Icon };
export default Icon;
