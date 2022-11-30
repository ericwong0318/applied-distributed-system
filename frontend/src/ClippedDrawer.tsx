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
import ForumIcon from '@mui/icons-material/Forum';
import {MainContent} from "./MainContent";
import {FixedAppBar} from "./FixedAppBar";
import {ListItemIcon} from "@mui/material";
import {MessageInterface} from "./Interfaces";
import Typography from "@mui/material/Typography";

export default function ClippedDrawer() {
    const [drawerWidth, setDrawerWidth] = React.useState(400)
    const [messages, setMessages] = useState<MessageInterface[]>([]);
    const [ws, setWs] = useState(new WebSocket("ws://" + process.env.REACT_APP_HOSTNAME + ":" +
        process.env.REACT_APP_PORT + "/channel" + "/0" + "/ws"));
    const [channelId, setChannelId] = useState(-1);

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
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/change-channel`, {
            method: "POST",
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                email: localStorage.getItem('email'),
                channelId: newChannelId
            })
        })
            .then((response) =>
                response.json()
            )
            .then((result) => {
                console.log(result);
                let data = result.data[0];
                let messages: MessageInterface[] = [];
                if (data === null) {
                    setMessages(messages)
                    return;
                }

                // Build messages array
                data.map((value: any, i: string | number) =>
                    messages?.push({
                        messageId: data[i].MessageId,
                        email: data[i].Email,
                        channelId: data[i].ChannelId,
                        time: data[i].Time,
                        content: data[i].Content
                    }));

                setMessages(messages);
            })
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
                    <List>
                        {chatList.map((chat) => (
                            <ListItem key={chat.channelId} disablePadding
                                      onClick={() => handleChangeChannel(chat.channelId)}>
                                <ListItemButton>
                                    <ListItemIcon>
                                        {chat.type === "personal" ?
                                            <ChatBubbleIcon fontSize={"small"}/> :
                                            <ForumIcon fontSize={"small"}/>}
                                    </ListItemIcon>
                                    <ListItemText primary={chat.name}/>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
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
