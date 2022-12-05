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
import Grid from "@mui/material/Grid";

export default function FormDialog() {
    const {enqueueSnackbar} = useSnackbar();

    // Create form
    const [createFormOpen, setCreateFormOpen] = React.useState(false);
    const [channelName, setChannelName] = React.useState("New channel Name");

    // Join form
    const [joinFormOpen, setJoinFormOpen] = React.useState(false);
    const [channelId, setChannelId] = React.useState(-1);

    // Create form handlers
    const handleCreateFormClickOpen = () => {
        setCreateFormOpen(true);
    };
    const handleCreateFormClose = () => {
        setCreateFormOpen(false);
    };
    const handleCreateChannels = () => {
        handleCreateFormClose();

        // Create a new channel
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/create-channel`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({channelName: channelName, email: localStorage.getItem('email')})
        })
            .then((response) => response.json())
            .then((result) => {
                enqueueSnackbar(result);
                window.location.reload();
            })
            .catch((err) => console.error(err));
    }

    // Join form handlers
    const handleJoinFormClickOpen = () => {
        setJoinFormOpen(true);
    };
    const handleJoinFormClose = () => {
        setJoinFormOpen(false);
    };
    const handleJoinChannels = () => {
        handleJoinFormClose();

        // Join a channel
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/join-channel`, {
            method: "POST",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({channelId: channelId, email: localStorage.getItem('email')})
        })
            .then((response) => response.json())
            .then((result) => {
                enqueueSnackbar(result);
                window.location.reload();
            })
            .catch((err) => console.error(err));
    }

    return (
        <div>
            <Grid container>
                <Grid item xs={8}>
                    <Button variant="outlined" onClick={handleCreateFormClickOpen}>
                        Create
                    </Button>
                </Grid>
                <Grid item xs={4}>
                    <Button variant="outlined" onClick={handleJoinFormClickOpen}>
                        Join
                    </Button>
                </Grid>
            </Grid>

            {/*create form*/}
            <Dialog open={createFormOpen} onClose={handleCreateFormClose}>
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
                            setChannelName(event.target.value);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateFormClose}>Cancel</Button>
                    <Button onClick={handleCreateChannels}>Create</Button>
                </DialogActions>
            </Dialog>

            {/*join form*/}
            <Dialog open={joinFormOpen} onClose={handleJoinFormClose}>
                <DialogTitle>Join a channel</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter valid channel ID
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="channelId"
                        label="Channel ID"
                        type="number"
                        fullWidth
                        variant="standard"
                        onChange={(event: TextFieldEventInterface) => {
                            setChannelId(parseInt(event.target.value));
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleJoinFormClose}>Cancel</Button>
                    <Button onClick={handleJoinChannels}>Join</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}