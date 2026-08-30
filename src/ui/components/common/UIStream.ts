import {Subject, Subscription} from "rxjs";
import {Component} from "react";
class ConnectionState {
    public static none = 0;
    public static waiting = 1;
    public static active = 2;
    public static done = 3;
}
class AsyncSnapshot<T = any> {
    constructor(
        private _connectionState: ConnectionState,
        private _data?: T,
        private _error?: any
    ) {}

    get connectionState() {
        return this._connectionState;
    }

    get data(): T | undefined {
        return this._data;
    }

    get error(): any {
        return this._error;
    }

    get hasData(): boolean {
        return this._data != null;
    }

    get hasError(): boolean {
        return this._error != null;
    }
}


export interface StreamBuilderProps {
    initialData: any|null;
    stream: Subject<any>;
    builder: { (snapshot: AsyncSnapshot): any };
}

class UIStream extends Component<StreamBuilderProps, any> {
    // private snapshot: AsyncSnapshot = new AsyncSnapshot(ConnectionState.none);

    // Subscription hiện tại, để huỷ đúng lúc unmount hoặc khi props.stream đổi - trước đây
    // componentDidUpdate() subscribe() lại vô điều kiện ở MỌI lần re-render (kể cả khi stream
    // không đổi) mà không bao giờ unsubscribe (componentWillUnmount() để trống), nên mỗi lần
    // component cha re-render (bấm nút menu, mở drawer...) lại cộng dồn thêm 1 subscription vào
    // CÙNG 1 Subject (các stream của BlocApp/BlocApplication là singleton sống suốt vòng đời) -
    // lần phát dữ liệu tiếp theo sẽ chạy setState() nhiều lần chồng chéo, càng dùng lâu càng nặng.
    private subscription: Subscription | null = null;

    constructor(props: StreamBuilderProps) {
        super(props);
        const {initialData} = props;
        // this.stream =stream
        this.state = {
            /**
             * @type {AsyncSnapshot}
             */
            snapshot: new AsyncSnapshot(ConnectionState.waiting, initialData),
        };
    }

    private subscribeToStream(stream: Subject<any>) {
        this.subscription = stream.subscribe(
            data => {
                this.setState({
                    snapshot: new AsyncSnapshot(ConnectionState.active, data, null),
                });
            },
            error => {
                if (error) {
                    this.setState({
                        snapshot: new AsyncSnapshot(ConnectionState.active, null, error),
                    });
                }
            },
            () => {
                this.setState({
                    snapshot: new AsyncSnapshot(ConnectionState.done, null, null),
                });
            }
        );
    }

    componentDidMount() {
        if (this.props.stream) {
            this.subscribeToStream(this.props.stream);
        }
    }

    componentDidUpdate(prevProps: Readonly<StreamBuilderProps>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.stream !== this.props.stream) {
            this.subscription?.unsubscribe();
            this.subscription = null;
            if (this.props.stream) {
                this.subscribeToStream(this.props.stream);
            }
        }
    }

    componentWillUnmount() {
        this.subscription?.unsubscribe();
        this.subscription = null;
    }

    render() {
        return this.props.builder(this.state.snapshot);
    }
}

export default UIStream;
