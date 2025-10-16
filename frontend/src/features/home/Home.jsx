import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div>
            <header>
                <h1>Tech-Support CN101</h1>
            </header>
            <main>
                <section>
                    <h2>Welcome</h2>
                    <p>This is a lightweight landing page for the mock project.</p>
                    <p>
                        <Link to="/login">Login</Link>
                    </p>
                </section>
            </main>
        </div>
    )
}
