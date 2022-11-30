import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {Divider} from "@mui/material";
import Sender from "./Sender";
import {MessageInterface} from "./Interfaces"

function Message(props: { userName: string, time: number, content: string }) {
    return <Grid xs={12}>
        <Typography variant="subtitle1" m={1}><b>{props.userName} at </b>
            {new Date(props.time * 1000).toLocaleString()}
        </Typography>
        <Typography variant="body2" m={1}>
            {props.content}
        </Typography>
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
                    <Message key={value.messageId} userName={value.email} time={value.time} content={value.content}/>
                )}
            </Grid>
            <Box sx={{display: 'flex', alignItems: 'flex-end', p: 1, m: 1,}}>
                <Sender ws={props.ws}/>
            </Box>
        </Box>
    </>
}