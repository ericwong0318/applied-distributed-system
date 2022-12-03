import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {TextFieldEventInterface} from "./Interfaces";
import {useSnackbar} from "notistack";

export default function FormDialog() {
    const {enqueueSnackbar} = useSnackbar();
    const [open, setOpen] = React.useState(false);
    const [channelName, setChannelName] = React.useState("New channel Name")

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCreateChannels = () => {
        handleClose();

        // Create a new channel
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/create-channel`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({channelName: channelName, email: localStorage.getItem('email')})
        })
            .then((response) => response.json())
            .then((result) => {
                enqueueSnackbar(result);
            })
            .catch((err) => console.error(err));
    }

    return (
        <div>
            <Button variant="outlined" onClick={handleClickOpen}>
                Create a channel
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Create a channel</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a channel name
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="channelName"
                        label="Channel Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(event: TextFieldEventInterface) => {
                            setChannelName(event.target.value)
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateChannels}>Create</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}