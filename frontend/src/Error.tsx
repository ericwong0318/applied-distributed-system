import {useRouteError} from "react-router-dom";
import Alert from '@mui/material/Alert';
import * as React from 'react';
import AlertTitle from '@mui/material/AlertTitle';

export default function ErrorPage() {
    let error: any = useRouteError();
    console.error(error);

    return (
        <div id="error-page">
            <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                Sorry, an unexpected error has occurred: <strong>{error.statusText || error.message}</strong>
            </Alert>
        </div>
    );
}