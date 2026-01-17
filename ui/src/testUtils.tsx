import {
  render as rtlRender,
  type RenderOptions as RtlRenderOptions,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import type { FunctionComponent, ReactElement } from 'react';
import translations from 'content/translations.json';

type DefaultLocale = 'en';
type Locale = keyof typeof translations | DefaultLocale;
type RenderOptions = RtlRenderOptions & { locale?: Locale };

function render(
  ui: ReactElement,
  { locale = 'en', ...renderOptions }: RenderOptions = {}
) {
  const Wrapper: FunctionComponent = ({ children }) => {
    const messages =
      locale in translations
        ? translations[locale as Exclude<Locale, DefaultLocale>]
        : undefined;

    return (
      <IntlProvider key={locale} locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render };
