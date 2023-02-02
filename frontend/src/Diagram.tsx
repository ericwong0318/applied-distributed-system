import React, {useEffect} from "react";
import mermaid from "mermaid";

export default function Diagram(props: { diagram: string }) {
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: "default",
            securityLevel: "loose",
        });
        mermaid.contentLoaded();
    }, []);
    return <div className="mermaid">{props.diagram}</div>;
}
