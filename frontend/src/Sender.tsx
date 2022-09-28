import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from "@mui/material/Unstable_Grid2";
import IconButton from "@mui/material/IconButton";
import SendIcon from '@mui/icons-material/Send';

export default function Sender() {
    return (
        <Box
            sx={{
                width: window.innerWidth * 0.6,
                maxWidth: '100%',
            }}
        >
            <Grid container spacing={1}>
                <Grid xs={10}>
                    <TextField
                        id="text-field"
                        label="Chat"
                        placeholder="Happy chatting"
                        multiline
                        fullWidth
                    />
                </Grid>
                <Grid>
                    <IconButton size="small">
                        <SendIcon/>
                    </IconButton>
                </Grid>
            </Grid>
        </Box>
    );
}
