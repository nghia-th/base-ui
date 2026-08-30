import React from "react";
import './loading.css'
class Loading extends React.Component <any,{isShow:boolean}>{

    constructor(props:any) {
        super(props);
        this.state = {
            isShow: props.isShow
        }
    }

    showLoading(isShow:boolean) {
        this.setState({isShow: isShow})
    }

    render() {
        let display = this.state.isShow ? "flex" : "none"
        return (
            <div id="overlay" style={{display: display}}>
                <div className="loader"></div>
            </div>
        )
    }
}

export default Loading;
