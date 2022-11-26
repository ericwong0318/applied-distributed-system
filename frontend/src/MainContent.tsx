import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {useEffect, useState} from "react";
import {Divider} from "@mui/material";
import Sender from "./Sender";

let url = "ws://" + process.env.REACT_APP_HOSTNAME + ":" + process.env.REACT_APP_PORT + "/ws";
let ws = new WebSocket(url);
let messageKey = 0;

interface MessageData {
    key: number,
    userName: string,
    time: string,
    content: string
}

function Message(props: { userName: string, time: string, content: string }) {
    return <Grid xs={12}>
        <Typography variant="subtitle1" m={1}><b>{props.userName} @</b>{props.time}</Typography>
        <Typography variant="body2" m={1}>
            {props.content}
        </Typography>
        <Divider/>
    </Grid>;
}

export function MainContent() {
    const [messages, setMessages] = useState<MessageData[]>([]);
    useEffect(() => {
        // Websocket
        ws.onmessage = function (msg) {
            let data = msg.data.split(";");
            let NewMessage: MessageData[] = messages.concat([{
                key: messageKey,
                userName: data[0],
                time: data[1],
                content: data[2]
            }]);
            messageKey++;
            setMessages(NewMessage);
        }
    })

    return <>
        {/*main content*/}
        <Box component="main" sx={{flexGrow: 1, p: 3}}>
            <Toolbar/>
            <Grid container spacing={2}>
                {messages.map((value) =>
                    <Message key={value.key} userName={value.userName} time={value.time} content={value.content}/>
                )}
            </Grid>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 1,
                    m: 1,
                }}
            >
                <Sender ws={ws}/>
            </Box>
        </Box>
    </>
}