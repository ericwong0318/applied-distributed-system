import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from "@mui/material/Unstable_Grid2";
import IconButton from "@mui/material/IconButton";
import SendIcon from '@mui/icons-material/Send';
import {v4 as uuidv4} from 'uuid';
import {MessageInterface, TextFieldEventInterface} from "./Interfaces";

export default function Sender(prop: { ws: WebSocket }) {
    const [textFieldValue, setTextFieldValue] = useState("");

    function handleChange(event: TextFieldEventInterface) {
        setTextFieldValue(event.target.value);
    }

    function handleSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();

        // Build message by interface
        let message: MessageInterface = {
            messageId: uuidv4(),
            email: localStorage.getItem("email")!,
            channelId: parseInt(localStorage.getItem("channelId")!),
            time: Math.floor(Date.now() / 1000),
            content: textFieldValue
        }

        prop.ws.send(JSON.stringify(message)); // Send message
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
