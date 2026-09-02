/**
 * Integration tests for Students page UI.
 * Tests focus on rendering, CRUD interactions, loading/submitting states and error handling.
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppContext } from "../../../../base/AppContext";
import ParentStudents from "../Students";
import { BlocParentStudents } from "../../../bloc/BlocParentStudents";
import { QuizStudentApi } from "../../../../api/QuizStudentApi";
import { QuizClassroomApi } from "../../../../api/QuizClassroomApi";
import { SnackbarProvider } from "notistack";

// Mock API modules
jest.mock('../../../../api/QuizStudentApi');
jest.mock('../../../../api/QuizClassroomApi');

const mockedStudentApi = QuizStudentApi as jest.Mocked<typeof QuizStudentApi>;
const mockedClassroomApi = QuizClassroomApi as jest.Mocked<typeof QuizClassroomApi>;

// Helper to provide AppContext with a mocked apiHandler
let apiRequestMock: jest.SpyInstance;
function mockApiRequestAll() {
  apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any, onError?: any) => {
    if (req === mockedClassroomApi.list()) {
      onSuccess({ data: [{ id: 1, name: 'Class A' }] });
    } else if (req === mockedStudentApi.list()) {
      // Default student list with one student for generic tests
      onSuccess({ data: [{ id: 10, fullName: 'Student X', classroomId: 1, username: 'sx' }] });
    } else if (req && req.method && req.url && req.method === 'POST') {
      // create
      onSuccess({});
    } else if (req && req.method && req.url && req.method === 'PUT') {
      // update
      onSuccess({});
    } else if (req && req.method && req.url && req.method === 'DELETE') {
      // delete
      onSuccess({});
    } else {
      // fallback
      onSuccess({});
    }
  });
}

function renderWithContext(ui: React.ReactElement) {
  const apiHandler = {
    showLoading: jest.fn(),
    onUnAuth: jest.fn(),
    onError: jest.fn()
  } as any;

  const appShare = {
    apiHandler,
    app: { blocCurrent: { content: {} } } as any,
    translate: (key: string) => key,
    dateTimeFormat: {
      dateFormat: 'YYYY-MM-DD',
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeFormat: 'HH:mm:ss',
      calendarViewDate: 'yy/mm/dd',
      calendarViewDateTime: 'yy/mm/dd HH:mm',
      timeDateFormat: 'HH:mm:ss YYYY-MM-DD'
    }
  };

  return render(
    <AppContext.Provider value={appShare as any}>
      <SnackbarProvider>{ui}</SnackbarProvider>
    </AppContext.Provider>
  );
}


describe('Students page UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedClassroomApi.list.mockReturnValue({ data: [{ id: 1, name: 'Class A' }] } as any);
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
  });

  test('loads and displays student list', async () => {
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    // Use generic apiRequest mock for this test
    mockApiRequestAll();

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for data to be rendered
    await waitFor(() => expect(screen.getByText('Student X')).toBeInTheDocument());
    expect(screen.getByText('Class A')).toBeInTheDocument();
    apiRequestMock.mockRestore();
  });

  test('shows empty state when no students', async () => {
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    const apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      if (req === mockedClassroomApi.list()) {
        onSuccess({ data: [{ id: 1, name: 'Class A' }] });
      } else if (req === mockedStudentApi.list()) {
        onSuccess({ data: [] });
      }
    });

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    // DataGrid shows "No rows" text – MUI renders it as a div with role="row" maybe not present, so check that the student name is absent.
    expect(screen.queryByText('Student X')).not.toBeInTheDocument();
    apiRequestMock.mockRestore();
  });

  test('creates a new student successfully', async () => {
    // Mock list endpoints
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    // Mock create endpoint to resolve
    mockedStudentApi.create.mockReturnValue({} as any);
    // Spy on internal apiRequest to handle both init and create calls
    const apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      if (req === mockedClassroomApi.list()) {
        onSuccess({ data: [{ id: 1, name: 'Class A' }] });
      } else if (req === mockedStudentApi.list()) {
        onSuccess({ data: [] });
      } else if (req === mockedStudentApi.create({ fullName: 'New', classroomId: 1, username: 'new', password: 'pwd' })) {
        onSuccess({});
      } else if (req === mockedStudentApi.list()) {
        // reload after create – return new student
        onSuccess({ data: [{ id: 11, fullName: 'New', classroomId: 1, username: 'new' }] });
      }
    });

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => expect(screen.getByText('Student X')).toBeInTheDocument());

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /new/i }));

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/full-name/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/quiz-classrooms/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'new' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pwd' } });

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Expect success snackbar (mocked via apiHandler.onError – but success uses enqueueSnackbar directly in component)
    // Since we use real SnackbarProvider, we can check for the success message text.
    await waitFor(() => expect(screen.getByText('quiz-student-created')).toBeInTheDocument());

    // New student should appear in list after reload
    await waitFor(() => expect(screen.getByText('New')).toBeInTheDocument());
    apiRequestMock.mockRestore();
  });

  test('validation prevents create when required fields missing', async () => {
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    const apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      if (req === mockedClassroomApi.list()) onSuccess({ data: [{ id: 1, name: 'Class A' }] });
      if (req === mockedStudentApi.list()) onSuccess({ data: [] });
    });

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Student X')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /new/i }));
    // Leave fields empty, click Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    // Snackbar with required-field key should appear
    await waitFor(() => expect(screen.getByText('required-field')).toBeInTheDocument());
    apiRequestMock.mockRestore();
  });

  test('edit student updates correctly', async () => {
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    mockedStudentApi.update.mockReturnValue({} as any);
    const apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      if (req === mockedClassroomApi.list()) onSuccess({ data: [{ id: 1, name: 'Class A' }] });
      if (req === mockedStudentApi.list()) onSuccess({ data: [{ id: 10, fullName: 'Old', classroomId: 1, username: 'old' }] });
      if (req === mockedStudentApi.update(10, { fullName: 'Updated', classroomId: 1, username: 'old', password: undefined })) onSuccess({});
      if (req === mockedStudentApi.list()) onSuccess({ data: [{ id: 10, fullName: 'Updated', classroomId: 1, username: 'old' }] });
    });

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Old')).toBeInTheDocument());
    // Click edit icon
    fireEvent.click(screen.getAllByLabelText('edit')[0]);
    // Change name
    fireEvent.change(screen.getByLabelText(/full-name/i), { target: { value: 'Updated' } });
    // Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    // Success snackbar
    await waitFor(() => expect(screen.getByText('quiz-student-updated')).toBeInTheDocument());
    // Updated name appears
    await waitFor(() => expect(screen.getByText('Updated')).toBeInTheDocument());
    apiRequestMock.mockRestore();
  });

  test('delete student after confirmation', async () => {
    
    mockedStudentApi.list.mockReturnValue({ data: [] } as any);
    mockedStudentApi.remove.mockReturnValue({} as any);
    const apiRequestMock = jest.spyOn(BlocParentStudents.prototype as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      if (req === mockedClassroomApi.list()) onSuccess({ data: [{ id: 1, name: 'Class A' }] });
      if (req === mockedStudentApi.list()) onSuccess({ data: [{ id: 20, fullName: 'ToDelete', classroomId: 1, username: 'del' }] });
      if (req === mockedStudentApi.remove(20)) onSuccess({});
      if (req === mockedStudentApi.list()) onSuccess({ data: [] });
    });

    renderWithContext(
      <MemoryRouter initialEntries={["/app/parent/students"]}>
        <Routes>
          <Route path="/app/parent/students" element={<ParentStudents />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('ToDelete')).toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText('delete')[0]);
    // Confirm dialog appears – click Yes (labelYes defaults to "yes")
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    await waitFor(() => expect(screen.getByText('quiz-student-deleted')).toBeInTheDocument());
    // List should be empty now
    await waitFor(() => expect(screen.queryByText('ToDelete')).not.toBeInTheDocument());
    apiRequestMock.mockRestore();
  });

  test('handles 401 unauth error on load', async () => {
    // Mock list to reject with 401
    
    mockedStudentApi.list.mockImplementation(() => {
      throw { code: 401 } as any;
    });
    const apiHandlerMock = { showLoading: jest.fn(), onUnAuth: jest.fn(), onError: jest.fn() } as any;
    const appShare = { apiHandler: apiHandlerMock, app: { blocCurrent: {} } as any, translate: (k: string) => k, dateTimeFormat: { dateFormat: '', dateTimeFormat: '', timeFormat: '', calendarViewDate: '', calendarViewDateTime: '', timeDateFormat: '' } };

    render(
      <AppContext.Provider value={appShare as any}>
        <SnackbarProvider>
          <MemoryRouter initialEntries={["/app/parent/students"]}>
            <Routes>
              <Route path="/app/parent/students" element={<ParentStudents />} />
            </Routes>
          </MemoryRouter>
        </SnackbarProvider>
      </AppContext.Provider>
    );

    await waitFor(() => expect(apiHandlerMock.onUnAuth).toHaveBeenCalled());
  });
});
