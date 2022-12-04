import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Cookies from 'js-cookie';
import {useNavigate} from "react-router-dom";
import Grid from "@mui/material/Grid";

export function FixedAppBar(props: { zIndex: (theme: any) => number }) {
    const navigate = useNavigate();

    function handleLogout() {
        Cookies.remove("tokenString");
        localStorage.clear();
        navigate("/");
    }

    return <>
        {/*appbar*/}
        <AppBar position="fixed" sx={{zIndex: props.zIndex}}>
            <Toolbar>
                <Grid container spacing={2}>
                    <Grid item xs={11}>
                        <Typography variant="h6" noWrap component="div">
                            {localStorage.getItem("email")}'s Chat
                        </Typography>
                    </Grid>
                    <Grid item xs={1}>
                        <Box sx={{justifyContent: 'flex-end'}}>
                            <Button color="inherit" onClick={handleLogout}>Logout</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Toolbar>
        </AppBar>
    </>;
}