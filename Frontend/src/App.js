import React, { useState, useEffect } from 'react';
import Welcome from "./pages/welcome/welcome";
import Email from "./pages/email/email";
import { checkAuth } from "./services/authService";

function App() {
    const [auth, setAuth] = useState(false);

    const check_auth = () => {
        checkAuth()
            .then((req) => {
                setAuth(req.data.code === 200);
            })
            .catch(() => {
                setAuth(false);
            });
    };

    useEffect(() => {
        check_auth();
    }, []);

    return (
        <div className="container">
            <div className="columns">
                <div className="col-4 col-lg-3 col-md-2 col-sm-1 col-xs-0"></div>

                <div className="col-4 col-lg-6 col-md-8 col-sm-10 col-xs-12">
                    {auth ? (
                        <Email ask_auth={check_auth} />
                    ) : (
                        <Welcome ask_auth={check_auth} />
                    )}
                </div>

                <div className="col-4 col-lg-3 col-md-2 col-sm-1 col-xs-0"></div>
            </div>
        </div>
    );
}

export default App;