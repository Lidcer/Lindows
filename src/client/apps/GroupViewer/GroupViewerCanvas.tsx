import React from "react";
import { stringify } from "querystring";

interface GroupViewerCanvasState {
    Initialized: boolean;
    ctx?: CanvasRenderingContext2D;
    width:  number;
    height:  number;
}

interface GroupViewerCanvasProps {
    canvasInteraction: (canvasInteraction: CanvasInteraction) => void;
}
 
export interface CanvasInteraction {
    addEventListiner: (value:string, callback: (...args:any) => void) => void;
    ctx: CanvasRenderingContext2D;
    height: (setHeight:number) => void;
    width: (setWidth:number) => void;
}


export class GroupViewerCanvas extends React.Component<GroupViewerCanvasProps, GroupViewerCanvasState>{
    private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();

    private map: [string, (...args:any) => void][] = []

    constructor(props) {
        super(props);
        this.state = { 
            Initialized: false,
            height: 0,
            width: 0,
        };
    }

    componentDidMount() {
        const ctx = this.canvas.current.getContext('2d');
        this.props.canvasInteraction({
            ctx,
            addEventListiner: this.addEventListiner,
            height: this.setHeight,
            width: this.setWidth,
        });
        this.setState({Initialized: true, ctx});
    }

    addEventListiner = (value:string, callback: (...args:any) => void) => {
        this.map.push([value, callback]);
        this.canvas.current.addEventListener(value,callback)
    }

    componentWillUnmount(){
        for (const [string, callback] of this.map) {
                this.canvas.current.removeEventListener(string, callback);
        }
        this.map = [];
    }
  

    setWidth = (width:number) => {
        if (this.state.width !== width) {
            this.setState({width});
        }
    }
    setHeight = (height:number) => {
        if (this.state.height !== height) {
            this.setState({height});
        }
    }
    
    render() {
        const msg = () => {
            if(this.state.Initialized && !this.state.ctx) {
                return <span className='text-danger'>Unable to create viewer</span>
            } else if (this.state.Initialized && this.state.ctx) {
                return null;
            }
            return <span>Loading...</span>;
        }
        
        
        return <>
            {msg()}
            <canvas
                ref={this.canvas}
                width={this.state.Initialized ? this.state.width : 0}
                height={this.state.Initialized ? this.state.height : 0} />
        </>
    }
}