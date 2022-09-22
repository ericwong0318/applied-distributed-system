import React from 'react';
import ClippedDrawer from "./ClippedDrawer";
import {createBrowserRouter, RouterProvider,} from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Error from "./Error";
import ForgetPassword from "./ForgetPassword";

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
        path: "/forget-password",
        element: <ForgetPassword/>,
    },

    // chatting page
    {
        path: "/chat", // credential
        element: <ClippedDrawer/>,
    },
]);

function App() {
    return (
        <div className="App">
            <RouterProvider router={router}/>
        </div>
    );
}

export default App;
