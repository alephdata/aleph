import { render as rtlRender } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

function render(ui, { locale = 'en', ...renderOptions } = {}) {
  const Wrapper = ({ children }) => {
    return <IntlProvider locale={locale}>{children}</IntlProvider>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render };
