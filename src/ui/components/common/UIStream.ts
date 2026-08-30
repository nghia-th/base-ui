import {Subject} from "rxjs";
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

    // private stream
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

    componentDidMount() {
        if (this.props.stream) {
            this.props.stream.subscribe(
                data => {

                    this.setState({
                        snapshot: new AsyncSnapshot(ConnectionState.active, data, null),
                    })
                    ;
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
    }

    componentDidUpdate(prevProps: Readonly<StreamBuilderProps>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.stream) {
            this.props.stream.subscribe(
                data => {
                    this.setState({
                        snapshot: new AsyncSnapshot(ConnectionState.active, data, null),
                    })
                    ;
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
    }

    componentWillUnmount() {
    }

    render() {
        return this.props.builder(this.state.snapshot);
    }
}

export default UIStream;
