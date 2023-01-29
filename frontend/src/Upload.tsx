// @ts-nocheck

import React, {useRef} from 'react';
import useFileUpload from 'react-use-file-upload';
import {ListItem, Paper} from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemText from '@mui/material/ListItemText';
import {MessageInterface} from "./Interfaces";
import {v4 as uuidv4} from "uuid";


export default function Upload(prop: { ws: WebSocket }) {
    const {
        files,
        fileNames,
        handleDragDropEvent,
        createFormData,
        setFiles,
        removeFile,
    } = useFileUpload();

    const inputRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // postman
        let formdata = new FormData();
        formdata.append("media", files.at(0));
        formdata.append("email", "hixoxa1262@adroh.com");

        let requestOptions = {
            method: 'POST',
            body: formdata,
            redirect: 'follow'
        };

        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/create-media`, requestOptions)
            .then(response => response.json())
            .then(result => {
                    const formData = createFormData();
                    for (let [i] of formData.entries()) {
                        console.log(i)
                        let message: MessageInterface = {
                            messageId: uuidv4(),
                            email: localStorage.getItem("email")!,
                            channelId: parseInt(localStorage.getItem("channelId")!),
                            time: Math.floor(Date.now() / 1000),
                            content: i,
                            fileId: result
                        }
                        prop.ws.send(JSON.stringify(message));
                    }
                }
            )
            .catch(error => console.log('error', error));
    };

    return (
        <div>
            <div className="form-container">
                {/* Display the files to be uploaded */}
                <div>
                    <List dense={true}>
                        {fileNames.map((name, i) =>
                            <ListItem
                                key={i}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete"
                                                onClick={() => removeFile(name)}>
                                        <DeleteIcon/>
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={name}/>
                            </ListItem>
                        )}
                    </List>
                </div>

                {/* Provide a drop zone and an alternative button inside it to upload files. */}
                <Paper variant="outlined">
                    <div
                        onDragEnter={handleDragDropEvent}
                        onDragOver={handleDragDropEvent}
                        onDrop={(e) => {
                            handleDragDropEvent(e);
                            setFiles(e, 'a');
                        }}
                    >
                        <Typography variant="h4" component="h1">
                            Drag and drop here
                        </Typography>
                        {/* Hide default HTML input */}
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            style={{display: 'none'}}
                            onChange={(e) => {
                                setFiles(e, 'a');
                                inputRef.current.value = null;
                            }}
                        />
                    </div>
                </Paper>
                <Button variant="outlined" onClick={() => inputRef.current.click()}>Select files</Button>

            </div>

            <div className="submit">
                <Button variant="outlined" onClick={handleSubmit}>Submit</Button>
            </div>
        </div>
    );
};