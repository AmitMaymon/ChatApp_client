import React, { useEffect, useState } from 'react';
import io from 'socket.io-client'
import suite from './suite'

function Login(props) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [registerd, setRegistered] = useState(true)
    const [usernameErrors, setUsernameErrors] = useState([])
    const [passwordErrors, setPasswordErrors] = useState([])
    const [confirmPasswordErrors, setConfirmPasswordErrors] = useState([])
    const [jwtVerify, setJwtVerify] = useState(false)



    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token && !props.loggedOut) {
            const newSocket = io('http://localhost:8000', {
                transports: ['websocket'],
                query: {
                    token: token
                }
            })
            props.setSocket(newSocket)
            newSocket.emit('AUTHENTICATION',{}, (response) => {
                console.log(response);
                if (response.success) {
                    props.setLoggedIn(true)
                    props.setUser(response.user)
                }
            })
        }
    }, [])



    const handleLogin = () => {
        const validationResult = suite({ username: username, password: password, isRegister: false })
        if (validationResult.isValid()) {
            console.log('Validation passed');
        } else {
            console.log('Validation failed', validationResult.getErrors());
            setUsernameErrors(validationResult.getErrors().username)
            setPasswordErrors(validationResult.getErrors().password)
            return
        }

        const newSocket = io('http://localhost:8000', {
            transports: ['websocket'],
            query: {
                username: username,
                password: password
            }
        })
        props.setSocket(newSocket)

        newSocket.emit('LOGIN', { username: username, password, password }, loginCheck)

        // props.setLoggedIn(true)
        // props.setUser(username)
    }





    const loginCheck = (data) => {
        console.log('LOGIN CHECK', data);
        if (data.success) {
            props.setLoggedIn(true)
            console.log(data.user);
            props.setUser(data.user)
            localStorage.setItem('token', data.token)
        } else {
            alert('Invalid username or password')
            setUsername('')
            setPassword('')

        }

    }




    const handleRegister = () => {
        const validationResult = suite({ username: username, password: password, confirmPassword: password2, isRegister: true })
        if (validationResult.isValid()) {
            console.log('Validation passed');
        } else {
            console.log('Validation failed', validationResult.getErrors());
            setUsernameErrors(validationResult.getErrors().username)
            setPasswordErrors(validationResult.getErrors().password)
            setConfirmPasswordErrors(validationResult.getErrors().confirmPassword)
            return
        }
        const newSocket = io('http://localhost:8000', {
            transports: ['websocket'],
            query: {
                username: username,
                password: password
            }
        })
        props.setSocket(newSocket)

        newSocket.emit('REGISTER', { username: username, password, password }, loginCheck)

        // props.setLoggedIn(true)
        // props.setUser(username)
    }



    return (
        <div>
            {
                registerd ?
                    <div>
                        <h1>Login</h1>
                        Username:<input type="text" value={username} onChange={(e) => { setUsername(e.target.value) }} /> <br />
                        Password:<input type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} /> <br />
                        <button onClick={handleLogin}>Login</button>
                        <br /><br />
                        {usernameErrors?.map((error, index) => {
                            return <div key={index} style={{ color: 'red' }}>{error}</div>
                        })}
                        {
                            passwordErrors?.map((error, index) => {
                                return <div key={index} style={{ color: 'red' }}>{error}</div>
                            })
                        }
                        {
                            confirmPasswordErrors?.map((error, index) => {
                                return <div key={index} style={{ color: 'red' }}>{error}</div>
                            })
                        }
                        <span style={{ cursor: 'pointer' }} onClick={() => { setRegistered(false) }}>Dont have an account?</span>

                    </div>
                    :
                    <div>
                        <h1>Register</h1>
                        Username:<input type="text" onChange={(e) => { setUsername(e.target.value) }} /> <br />
                        Password:<input type="password" onChange={(e) => { setPassword(e.target.value) }} /> <br />
                        Confirm Password:<input type="password" onChange={(e) => { setPassword2(e.target.value) }} /> <br />
                        <button onClick={handleRegister}>Register</button>
                        <br /> <br />
                        {usernameErrors?.map((error, index) => {
                            return <div key={index} style={{ color: 'red' }}>{error}</div>
                        })}
                        {
                            passwordErrors?.map((error, index) => {
                                return <div key={index} style={{ color: 'red' }}>{error}</div>
                            })
                        }
                        {

                        }
                        <span style={{ cursor: 'pointer' }} onClick={() => { setRegistered(true) }}>Have an account?</span>

                    </div>
            }

        </div>
    );
}

export default Login;