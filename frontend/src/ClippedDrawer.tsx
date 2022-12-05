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
import {FixedAppBar} from "./FixedAppBar";
import {ListItemIcon} from "@mui/material";
import {ChannelInterface, MessageInterface} from "./Interfaces";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import FormDialog from "./FormDialog";
import Button from "@mui/material/Button";
import {MainContent} from "./MainContent";
import {useSnackbar} from "notistack";

export default function ClippedDrawer() {
    const [drawerWidth] = useState(300)
    const [messages, setMessages] = useState<MessageInterface[]>([]);
    const [ws, setWs] = useState(new WebSocket("ws://" + process.env.REACT_APP_HOSTNAME + ":" +
        process.env.REACT_APP_PORT + "/channel/0/ws"));
    const [channelId, setChannelId] = useState(-1);
    const [channels, setChannels] = useState<ChannelInterface[]>([])
    const {enqueueSnackbar} = useSnackbar();

    // WebSocket receive messages
    useEffect(() => {
        ws.onmessage = function (msg) {
            console.log(messages);
            let NewMessage: MessageInterface[] = messages.concat([JSON.parse(msg.data)]);
            console.log(NewMessage);
            setMessages(NewMessage);
        }
    }, [channelId, messages, ws])

    // Read user
    useEffect(() => {
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/read-user`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({email: localStorage.getItem('email')})
        })
            .then((response) => response.json())
            .then((result) => {
                if (result === null) return;
                let newChannels: ChannelInterface[] = result.map((elem: any) => {
                    let channel: ChannelInterface = {
                        channelId: elem.channelResults.channelId,
                        channelName: elem.channelResults.channelName,
                        wiki: elem.channelResults.wiki
                    };
                    return channel;
                })
                setChannels(newChannels);
                return;
            })
    }, [])

    const handleChangeChannel = (newChannelId: number) => {
        setChannelId(newChannelId);
        localStorage.setItem("channelId", String(newChannelId));

        // change websocket connection
        setWs(new WebSocket("ws://" + process.env.REACT_APP_HOSTNAME + ":" + process.env.REACT_APP_PORT + "/channel"
            + "/" + newChannelId + "/ws"));

        // Send channelId to backend
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

    const handleExitChannel = (channelId: number) => {
        // Send channelId to backend
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/exit-channel`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({
                email: localStorage.getItem('email'),
                channelId: channelId
            })
        })
            .then((response) => response.json())
            .then((result) => {
                window.location.reload();
                enqueueSnackbar(result);
            })
            .catch((err) => console.error(err))
    }

    const handleDeleteChannel = (channelId: number) => {
        // Send channelId to backend
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/delete-channel`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({
                email: localStorage.getItem('email'),
                channelId: channelId
            })
        })
            .then((response) => response.json())
            .then((result) => {
                window.location.reload();
                enqueueSnackbar(result);
            })
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
                            <FormDialog/>
                        </Grid>
                    </Grid>
                    {channels === null ?
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
                                        <ListItemText primary={c.channelName} secondary={"ID: " + c.channelId}/>
                                        <Button color="warning" size="small" variant="outlined"
                                                onClick={() => handleExitChannel(c.channelId)}>
                                            Exit
                                        </Button>
                                        <Button color="error" size="small" variant="outlined"
                                                onClick={() => handleDeleteChannel(c.channelId)}>
                                            Del
                                        </Button>
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
