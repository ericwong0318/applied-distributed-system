import * as React from 'react';
import {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import {MainContent} from "./MainContent";
import {FixedAppBar} from "./FixedAppBar";
import {ListItemIcon} from "@mui/material";
import {ChannelInterface, MessageInterface} from "./Interfaces";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";

export default function ClippedDrawer() {
    const [drawerWidth, setDrawerWidth] = React.useState(400)
    const [messages, setMessages] = useState<MessageInterface[]>([]);
    const [ws, setWs] = useState(new WebSocket("ws://" + process.env.REACT_APP_HOSTNAME + ":" +
        process.env.REACT_APP_PORT + "/channel" + "/0" + "/ws"));
    const [channelId, setChannelId] = useState(-1);
    const [channels, setChannels] = useState<ChannelInterface[]>([])

    // resize drawer width
    React.useEffect(() => {
        function updateSize() {
            if (window.innerWidth >= 1024) {
                setDrawerWidth(400)
            } else {
                setDrawerWidth(window.innerWidth * 0.1)
            }
        }

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        // WebSocket receive messages
        ws.onmessage = function (msg) {
            let data = msg.data.split(";");
            let NewMessage: MessageInterface[] = messages.concat([{
                messageId: data[3],
                email: data[0],
                // @ts-ignore
                channelId: parseInt(localStorage.getItem("channelId")),
                time: data[1],
                content: data[2]
            }]);
            console.log(NewMessage);
            setMessages(NewMessage);
        }
    }, [messages, ws])

    // Read user
    useEffect(() => {
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/read-user`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({email: localStorage.getItem('email')})
        }).then((response) => response.json()
        ).then((result) => {
            let newChannels: ChannelInterface[] = result.channelId.map((channelId: number) => {
                let channel: ChannelInterface = {
                    channelId: channelId,
                    channelName: "Channel " + channelId,
                    wiki: "No Wiki content"
                };
                return channel;
            })
            setChannels(newChannels);
            return;
        })
    }, [])

    const handleChangeChannel = (newChannelId: number) => {
        setChannelId(newChannelId);
        // change websocket connection
        setWs(new WebSocket("ws://" + process.env.REACT_APP_HOSTNAME + ":" + process.env.REACT_APP_PORT + "/channel"
            + "/" + newChannelId + "/ws"));
        localStorage.setItem('channelId', String(newChannelId));

        // Send channelId to backend
        console.log(localStorage.getItem('email'));
        console.log(newChannelId);
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/read-messages`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({
                email: localStorage.getItem('email'),
                channelId: newChannelId
            })
        })
            .then((response) => response.json())
            .then((result) => setMessages(result))
            .catch((err) => console.error(err))
    }

    return (
        <Box sx={{display: 'flex'}}>
            {/*top bar*/}
            <CssBaseline/>
            <FixedAppBar zIndex={(theme) => theme.zIndex.drawer + 1}/>

            {/*sidebar*/}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth, flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {width: drawerWidth, boxSizing: 'border-box'},
                }}
            >
                <Toolbar/>
                <Box sx={{overflow: 'auto'}}>
                    <Grid container spacing={1}>
                        <Grid xs={15}>
                            <br/>
                            <TextField
                                id="text-field"
                                label="New channel Id"
                                placeholder="Happy chatting"
                                // value={textFieldValue}
                                // onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        // handleSubmit(e)
                                    }
                                }}
                            />
                        </Grid>
                        <Grid>
                            <IconButton size="small"
                                // onClick={handleSubmit}
                            >
                                <SendIcon/>
                            </IconButton>
                        </Grid>
                    </Grid>
                    {typeof channels === "undefined" ?
                        <Typography variant="body2" align="center" m={10}>
                            You don't have any channels. Please join a channel.
                        </Typography> :
                        <List>
                            {channels.map((c) => (
                                <ListItem key={c.channelId} disablePadding
                                          onClick={() => handleChangeChannel(c.channelId)}>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            <ChatBubbleIcon fontSize={"small"}/>
                                        </ListItemIcon>
                                        <ListItemText primary={c.channelId.toString()}/>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    }
                </Box>
            </Drawer>

            {/*main content e.g. messages and text-field*/}
            {channelId === -1 ?
                <Typography variant="h5" align="center" m={50}>
                    Please Select a channel.
                </Typography> :
                /*@ts-ignore*/
                <MainContent message={messages} ws={ws}/>}
        </Box>
    );
}
