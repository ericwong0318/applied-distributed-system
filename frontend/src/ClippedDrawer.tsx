import * as React from 'react';
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

    // resize drawer width
    const [drawerWidth, setDrawerWidth] = React.useState(400)
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
    let chatList: { name: string, type: "personal" | "group" }[] = [
        {name: "Friend 1", type: "personal"},
        {name: "Friend 2", type: "personal"},
        {name: "Group 1", type: "group"},
        {name: "Group 2", type: "group"},
    ];

    const [auth, setAuth] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAuth(event.target.checked);
    };

    // app bar props
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{display: 'flex'}}>
            <CssBaseline/>

            <FixedAppBar zIndex={(theme) => theme.zIndex.drawer + 1} auth={auth} onClick={handleMenu}
                         anchorEl={anchorEl} onClose={handleClose}/>

            {/*sidebar*/}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {width: drawerWidth, boxSizing: 'border-box'},
                }}
            >
                <Toolbar/>
                <Box sx={{overflow: 'auto'}}>
                    <List>
                        {chatList.map((chat) => (
                            <ListItem key={chat.name} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        {chat.type === "personal" ? <ChatBubbleIcon fontSize={"small"}/> :
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
            <MainContent/>

        </Box>

    );
}
