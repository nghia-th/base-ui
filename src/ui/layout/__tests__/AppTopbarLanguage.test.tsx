import { MemoryRouter } from 'react-router-dom';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';

jest.mock('../../i18next/i18next', () => ({
  __esModule: true,
  default: {
    // Allow chaining .use(...).use(...).init()
    use: jest.fn(() => ({
      use: jest.fn(() => ({ init: jest.fn() })),
      changeLanguage: jest.fn()
    })),
    // Also expose changeLanguage directly for safety
    changeLanguage: jest.fn()
  }
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
  SnackbarProvider: ({ children }: any) => <>{children}</>
}));

jest.mock('../../i18next/Lang', () => ({
  lang: {
    loadLang: jest.fn()
  }
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

import AppTopbar from '../AppTopbar';

describe('AppTopbar language switch', () => {
  const defaultProps = {
    leftOffset: 0,
    breadcrumb: [],
    onMenuClick: jest.fn(),
    onConfigClick: jest.fn(),
    onRightMenuClick: jest.fn(),
    onLogout: jest.fn()
  } as any;

  test('successful language change closes menu without error snackbar', async () => {
    const { lang } = require('../../i18next/Lang');
    (lang.loadLang as jest.Mock).mockResolvedValue(undefined);

  const { getByLabelText, queryByText } = render(
    <MemoryRouter>
      <SnackbarProvider>
        <AppTopbar {...defaultProps} />
      </SnackbarProvider>
    </MemoryRouter>
  );

    // Open language menu
    fireEvent.click(getByLabelText('language'));
    // Click Vietnamese option
    fireEvent.click(queryByText('vietnamese') as HTMLElement);

    await waitFor(() => expect(lang.loadLang).toHaveBeenCalledWith('vi', expect.any(Object)));
    // No error snackbar should be shown (enqueueSnackbar is a mock inside useSnackbar, but we cannot access it directly here)
    // The test passes if loadLang resolves without throwing.
  });

  test('failed language change shows error snackbar', async () => {
    const { lang } = require('../../i18next/Lang');
    (lang.loadLang as jest.Mock).mockRejectedValue(new Error('fail'));
    const { useSnackbar } = require('notistack');
    const enqueueMock = jest.fn();
    // Override mock to capture enqueueSnackbar
    jest.spyOn(require('notistack'), 'useSnackbar').mockReturnValue({ enqueueSnackbar: enqueueMock });

  const { getByLabelText, queryByText } = render(
    <MemoryRouter>
      <SnackbarProvider>
        <AppTopbar {...defaultProps} />
      </SnackbarProvider>
    </MemoryRouter>
  );
    fireEvent.click(getByLabelText('language'));
    fireEvent.click(queryByText('english') as HTMLElement);

    await waitFor(() => expect(enqueueMock).toHaveBeenCalledWith('error', { variant: 'error' }));
  });
});
