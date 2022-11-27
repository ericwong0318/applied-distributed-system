import * as React from 'react';
import {useState} from 'react';
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

export default function ClippedDrawer() {
    const [drawerWidth, setDrawerWidth] = React.useState(400)
    const [url, setUrl] = useState("ws://" + process.env.REACT_APP_HOSTNAME + ":" +
        process.env.REACT_APP_PORT + "/channel" + "/1" + "/ws")

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

    // placeholder for sidebar
    let chatList: { cid: number, name: string, type: "personal" | "group" }[] = [
        {cid: 1, name: "Friend 1", type: "personal"},
        {cid: 2, name: "Friend 2", type: "personal"},
        {cid: 3, name: "Group 1", type: "group"},
        {cid: 4, name: "Group 2", type: "group"},
    ];

    const handleChangeChannel = (cid: number) => {
        // change websocket connection
        setUrl("ws://" + process.env.REACT_APP_HOSTNAME + ":" + process.env.REACT_APP_PORT + "/channel"
            + "/" + cid + "/ws");
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
                            <ListItem key={chat.cid} disablePadding onClick={() => handleChangeChannel(chat.cid)}>
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
            <MainContent url={url} />
        </Box>
    );
}
