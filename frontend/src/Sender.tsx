import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from "@mui/material/Unstable_Grid2";
import IconButton from "@mui/material/IconButton";
import SendIcon from '@mui/icons-material/Send';
import {v4 as uuidv4} from 'uuid';
import {TextFieldEventInterface} from "./Interfaces";

export default function Sender(prop: { ws: WebSocket }) {
    const [textFieldValue, setTextFieldValue] = useState("");

    function handleChange(event: TextFieldEventInterface) {
        setTextFieldValue(event.target.value);
    }

    function handleSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        prop.ws.send(localStorage.getItem("email") + ";" + new Date().toLocaleString() + ";" + textFieldValue
            + ";" + uuidv4() + ";" + localStorage.getItem("channelId")); // Send data using websocket
        setTextFieldValue(""); // Clean input
    }

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
                        value={textFieldValue}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit(e)
                            }
                        }}
                    />
                </Grid>
                <Grid>
                    <IconButton size="small" onClick={handleSubmit}>
                        <SendIcon/>
                    </IconButton>
                </Grid>
            </Grid>
        </Box>
    );
}
