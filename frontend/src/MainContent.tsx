import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {Divider} from "@mui/material";
import Sender from "./Sender";
import {MessageInterface} from "./Interfaces"
import ReactMarkdown from 'react-markdown'
import Button from "@mui/material/Button";

function Message(props: { userName: string, time: number, content: string, fileId: string | undefined }) {

    const handleDownloadMedia = (e: { preventDefault: () => void; }) => {
        e.preventDefault()
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
        console.log("download")
        let urlencoded = new URLSearchParams();
        if (props.fileId !== undefined) {
            urlencoded.append("mediaId", props.fileId);
        }
        let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: urlencoded,
            redirect: 'follow'
        };

        // @ts-ignore
        fetch("http://localhost:8081/download-media", requestOptions)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = "download"; // File name
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => console.log(error));
    }

    return <Grid xs={12}>
        <Typography variant="subtitle1" m={1}><b>{props.userName} at </b>
            {new Date(props.time * 1000).toLocaleString()}
        </Typography>
        <ReactMarkdown>{props.content}</ReactMarkdown>
        {props.fileId === "" || props.fileId === undefined ? "" :
            <Button onClick={handleDownloadMedia}>Download</Button>}
        <Divider/>
    </Grid>;
}

export function MainContent(props: { message: MessageInterface[], ws: WebSocket }) {
    return <>
        {/*main content*/}
        <Box component="main" sx={{flexGrow: 1, p: 3}}>
            <Toolbar/>
            <Grid container spacing={2}>
                {props.message === null ? "" : props.message.map((value) =>
                    <Message key={value.messageId} userName={value.email} time={value.time} content={value.content}
                             fileId={value.fileId}/>
                )}
            </Grid>
            <Box sx={{display: 'flex', alignItems: 'flex-end', p: 1, m: 1,}}>
                <Sender ws={props.ws}/>
            </Box>
        </Box>
    </>
}