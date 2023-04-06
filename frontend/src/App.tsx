import React, {createContext, useEffect, useState} from 'react';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {SnackbarProvider} from 'notistack';
import ClippedDrawer from "./ClippedDrawer";
import Register from "./Register";
import Login from "./Login";
import Error from "./Error";
import ResetPassword from "./ResetPassword";
import {VideoConferencing} from "./VideoConferencing";

export const AuthContext = createContext(undefined);

const router = createBrowserRouter([
    // register
    {
        path: "/",
        element: <Register/>,
        errorElement: <Error/>,
    },

    // login
    {
        path: "/login",
        element: <Login/>,
    },

    // forget password
    {
        path: "/reset-password",
        element: <ResetPassword/>,
    },

    // chatting page
    {
        path: "/chat",
        element: <ClippedDrawer/>,
    },

    // video conferencing page
    {
        path: "/video-conferencing",
        element: <VideoConferencing/>,
    },
],);

export function checkJwt(setIsLogin: (value: (((prevState: boolean) => boolean) | boolean)) => void) {
    fetch(`https://${process.env.REACT_APP_HOSTNAME}/check-jwt`, {
        method: "POST",
        credentials: "include", // for receiving cookie
        headers: {'Content-type': 'application/json'},
    })
        .then((response) => {
            if (response.ok) {
                setIsLogin(true)
            }
        })
        .catch((err) => console.error(err.message))
}

function App() {
    // global states
    const [isLogin, setIsLogin] = useState(false);

    useEffect(() => {
        // check credential
        checkJwt(setIsLogin);
    }, []);

    return (
        <div className="App">
            {/*context's default value type is not matched the below value type*/}
            {/* @ts-ignore*/}
            <AuthContext.Provider value={{isLogin, setIsLogin}}>
                <SnackbarProvider maxSnack={3}>
                    <RouterProvider router={router}/>
                </SnackbarProvider>
            </AuthContext.Provider>
        </div>
    );
}

export default App;
