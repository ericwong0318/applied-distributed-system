import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import Button from "@mui/material/Button";

const Canvas = class extends React.Component {
    private readonly canvas: any;
    constructor(props: {} | Readonly<{}>) {
        super(props);
        this.canvas = React.createRef();
    }

    render() {
        return (
            <div>
                <ReactSketchCanvas
                    ref={this.canvas}
                    strokeWidth={5}
                    strokeColor="black"
                />
                <Button
                    variant={"outlined"}
                    onClick={() => {
                        this.canvas.current.exportImage("png")
                            .then((data: any) => {
                                console.log(data);

                                // Download whiteboard as PNG
                                const link = document.createElement("a");
                                link.href = data;
                                link.download = "download.png";
                                link.click();
                            })
                            .catch((e: any) => {
                                console.log(e);
                            });
                    }}
                >
                    Download image
                </Button>
                <br/>
            </div>
        );
    }
};

export default Canvas;
