import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Cookies from 'js-cookie';
import {useNavigate} from "react-router-dom";

export function FixedAppBar(props: {
    zIndex: (theme: any) => number, auth: boolean,
    onClick: (event: React.MouseEvent<HTMLElement>) => void, anchorEl: HTMLElement | null, onClose: () => void
}) {
    const navigate = useNavigate();

    function handleLogout() {
        Cookies.remove("tokenString");
        navigate("/");
    }

    return <>
        {/*appbar*/}
        <AppBar position="fixed" sx={{zIndex: props.zIndex}}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Chat
                </Typography>
                {" "}
                <Box sx={{justifyContent: 'flex-end'}}>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Box>
            </Toolbar>
        </AppBar>
    </>;
}