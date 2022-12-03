import * as React from 'react';
import {useEffect} from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link'
import {useSnackbar} from 'notistack';
// @ts-ignore
import {AuthContext, checkJwt} from "./App.tsx";
import {useNavigate} from "react-router-dom";


export default function Login() {
    const {enqueueSnackbar} = useSnackbar();
    // @ts-ignore
    const {isLogin, setIsLogin} = React.useContext(AuthContext);
    const navigate = useNavigate();

    // check isLogin
    useEffect(() => {
        checkJwt(isLogin)
        if (isLogin) {
            navigate("/chat");
        }
    }, [isLogin, navigate])

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        // Send email and password to backend
        fetch(`http://${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_PORT}/login`, {
            method: "POST",
            credentials: "include", // for receiving cookie
            headers: {'Content-type': 'application/json',},
            body: JSON.stringify({
                email: data.get('email'),
                password: data.get('password'),
            })
        })
            .then((response) => {
                if (response.ok) {
                    setIsLogin(true)
                    localStorage.setItem('email', data.get('email') as string);
                    navigate("/chat");
                }
                return response.json();
            })
            .then((json) => (enqueueSnackbar(json)))
            .catch((err) => console.error(err.message))
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline/>
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h4">
                    Sign in
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2}}
                    >
                        Sign In
                    </Button>
                    <Grid container>
                        <Grid item xs>
                            <Link href="/reset-password" variant="body2">
                                Forget/ Reset password
                            </Link>
                        </Grid>
                        <Grid item>
                            <Link href="/" variant="body2">
                                Sign Up
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
}