import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'

export default function Home() {
    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">Home</h2>
                <div className="breadcrumb">Home</div>
            </div>

            <section className="home-hero">
                <div className="hero-inner container">
                    <h2 className="hero-title">Welcome to Tech-Support CN101</h2>
                    <p className="hero-sub">A lightweight platform for learning and support. Sign in to access your dashboard and course materials.</p>
                    <Link to="/login" className="hero-cta">Sign in</Link>
                </div>
            </section>
        </Layout>
    )
}