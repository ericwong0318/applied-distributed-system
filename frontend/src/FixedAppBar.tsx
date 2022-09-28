import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export function FixedAppBar(props: {
    zIndex: (theme: any) => number, auth: boolean,
    onClick: (event: React.MouseEvent<HTMLElement>) => void, anchorEl: HTMLElement | null, onClose: () => void
}) {
    return <>
        {/*appbar*/}
        <AppBar position="fixed" sx={{zIndex: props.zIndex}}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Chat
                </Typography>
            </Toolbar>
        </AppBar>
    </>;
}