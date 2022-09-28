import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {Divider} from "@mui/material";
import Sender from "./Sender";


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
    return <>
        {/*main content*/}
            <Box component="main" sx={{flexGrow: 1, p: 3}}>
                <Toolbar/>
                <Grid container spacing={2}>
                    <Message userName="Friend" time="10:30"
                             content="Remote work, once a rare and innovative strategy reserved for tech companies, is no
                             longer a fringe business practice. The IWG 2019 Global Workspace Survey found that 3
                             out of 4 workers around the globe consider flexible working to be “the new normal.”
                             This was before the coronavirus pandemic spurred even more organizations to
                             implement remote work policies.

                             The remote work model offers many obvious advantages, from lower overhead and
                             flexible
                             schedules to reductions in employee commuting and increases in productivity along
                             with lower attrition rates. It also brings obvious disadvantages, such as worker
                             loneliness and burnout."/>
                    <Message userName="Me" time="11:00"
                             content="Good"/>
                </Grid>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 1,
                    m: 1,
                }}
            >
                <Sender/>
            </Box>
            </Box>
    </>
}