import {LiveKitRoom, VideoConference} from '@livekit/components-react';
import {useEffect, useState} from "react";

export function VideoConferencing() {
    const [token, setToken] = useState("");

    // Get token
    useEffect(() => {
            fetch(`https://${process.env.REACT_APP_HOSTNAME}/join-video-conference`, {
                method: "POST",
                credentials: "include", // for receiving cookie
                headers: {'Content-type': 'application/json'},
                body: JSON.stringify({
                    email: localStorage.getItem("email"),
                    channelId: localStorage.getItem("channelId")
                })
            })
                .then((response) => response.json())
                .then((result) => setToken(result))
                .catch((err) => console.error(err.message))
        }, [token])


    return (
        <>
            {token === "" ? <>Loading</> :
                <LiveKitRoom token={token} serverUrl="wss://applied-distributed-system-j4crdqt3.livekit.cloud"
                             connect={true}>
                    <VideoConference/>
                </LiveKitRoom>}
        </>
    );
}