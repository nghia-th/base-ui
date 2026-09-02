/**
 * Unit tests for BlocParentStudents.
 * The tests verify BLoC behavior without touching UI components.
 */
import { BlocParentStudents } from "../../bloc/BlocParentStudents";
import { QuizStudentApi } from "../../../api/QuizStudentApi";
import { QuizClassroomApi } from "../../../api/QuizClassroomApi";

// Mock the API modules
jest.mock('../../../api/QuizStudentApi');
jest.mock('../../../api/QuizClassroomApi');

const mockedStudentApi = QuizStudentApi as jest.Mocked<typeof QuizStudentApi>;
const mockedClassroomApi = QuizClassroomApi as jest.Mocked<typeof QuizClassroomApi>;

// Helper to create a fresh bloc with a mocked apiHandler
function createBloc() {
  const bloc = new BlocParentStudents();
  // mock apiHandler with jest functions (showLoading, onUnAuth, onError)
  bloc.apiHandler = {
    showLoading: jest.fn(),
    onUnAuth: jest.fn(),
    onError: jest.fn()
  } as any;
  return bloc;
}

describe('BlocParentStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initData loads classrooms then students', async () => {
    mockedClassroomApi.list.mockReturnValue({
      // Simulate a request object – the actual shape is not used by apiRequest mock
      // We'll mock apiRequest via the IBloc implementation later, but for simplicity we
      // directly call the callbacks.
    } as any);
    mockedStudentApi.list.mockReturnValue({} as any);

    const bloc = createBloc();
    // Spy on internal apiRequest to invoke callbacks synchronously
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((request: any, onSuccess: any) => {
      // Immediately invoke success callback with mock data
      const mockRes = { data: [] };
      onSuccess(mockRes);
    });

    await bloc.initData();
    expect(apiRequestSpy).toHaveBeenCalledTimes(2); // classrooms + students
    // Streams should be set (empty arrays)
    expect(bloc.getStream('classrooms')).toBeDefined();
    expect(bloc.getStream('students')).toBeDefined();
  });

  test('reload calls student list and updates stream', async () => {
    const bloc = createBloc();
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((req: any, onSuccess: any) => {
      onSuccess({ data: [{ id: 1, fullName: 'Test', parentId: 1, classroomId: 1, username: 'test' }] });
    });
    bloc.reload();
    expect(apiRequestSpy).toHaveBeenCalledTimes(1);
    const students = bloc.getStream('students') as any;
    expect(students).toBeDefined();
  });

  test('create calls API and triggers reload', async () => {
    const bloc = createBloc();
    const reloadSpy = jest.spyOn(bloc, 'reload');
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((_req: any, onSuccess: any) => {
      onSuccess({});
    });
    const onComplete = jest.fn();
    const onError = jest.fn();
    bloc.create({ fullName: 'A', classroomId: 1, username: 'a', password: 'p' }, onComplete, onError);
    expect(apiRequestSpy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });

  test('update calls API and triggers reload', async () => {
    const bloc = createBloc();
    const reloadSpy = jest.spyOn(bloc, 'reload');
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((_req: any, onSuccess: any) => {
      onSuccess({});
    });
    const onComplete = jest.fn();
    const onError = jest.fn();
    bloc.update(5, { fullName: 'B' }, onComplete, onError);
    expect(apiRequestSpy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });

  test('remove calls API and triggers reload', async () => {
    const bloc = createBloc();
    const reloadSpy = jest.spyOn(bloc, 'reload');
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((_req: any, onSuccess: any) => {
      onSuccess({});
    });
    const onComplete = jest.fn();
    const onError = jest.fn();
    bloc.remove(3, onComplete, onError);
    expect(apiRequestSpy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });

  test('openNew sets correct fields', () => {
    const bloc = createBloc();
    bloc.openNew();
    expect(bloc.getField('req')).toEqual({ fullName: '', classroomId: '', username: '', password: '' });
    expect(bloc.getField('form_view')).toEqual({ isShow: true, id: 0 });
  });

  test('openEdit sets fields based on row', () => {
    const bloc = createBloc();
    const row = { id: 10, fullName: 'John', classroomId: 2, username: 'john', parentId: 1 } as any;
    bloc.openEdit(row);
    expect(bloc.getField('req')).toEqual({ fullName: 'John', classroomId: 2, username: 'john', password: '' });
    expect(bloc.getField('form_view')).toEqual({ isShow: true, id: 10 });
  });

  test('closeForm resets form_view and submitting', () => {
    const bloc = createBloc();
    bloc.closeForm();
    expect(bloc.getField('form_view')).toEqual({ isShow: false, id: 0 });
    expect(bloc.getStream('submitting')).toBeDefined();
  });

  test('save validates required fields and calls onError', () => {
    const bloc = createBloc();
    const onComplete = jest.fn();
    const onError = jest.fn();
    // Simulate form_view for create (id = 0)
    bloc.setStream('form_view', { isShow: true, id: 0 });
    bloc.setField('req', { fullName: '', classroomId: '', username: '', password: '' });
    bloc.save(onComplete, onError);
    expect(onError).toHaveBeenCalledWith({ messageKey: 'required-field' });
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('save creates new student when not editing', async () => {
    const bloc = createBloc();
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((_req: any, onSuccess: any) => {
      onSuccess({});
    });
    const onComplete = jest.fn();
    const onError = jest.fn();
    // Set valid request data for creation
    bloc.setStream('form_view', { isShow: true, id: 0 });
    bloc.setField('req', { fullName: 'New', classroomId: 1, username: 'new', password: 'pwd' });
    bloc.save(onComplete, onError);
    expect(apiRequestSpy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  test('save updates existing student when editing', async () => {
    const bloc = createBloc();
    const apiRequestSpy = jest.spyOn(bloc as any, 'apiRequest').mockImplementation((_req: any, onSuccess: any) => {
      onSuccess({});
    });
    const onComplete = jest.fn();
    const onError = jest.fn();
    // Editing mode (id > 0)
    bloc.setStream('form_view', { isShow: true, id: 5 });
    bloc.setField('req', { fullName: 'Edit', classroomId: 2, username: 'edit', password: '' });
    bloc.save(onComplete, onError);
    expect(apiRequestSpy).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
});
