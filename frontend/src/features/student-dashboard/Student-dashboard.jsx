import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Layout from '../../components/Layout'

export default function Dashboard() {
    const { user, token, setProfile } = useAuth()
    const isInstructor = user && user.email && user.email.includes('instructor')
    const [me, setMe] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        // fetch user profile from API after login
        const controller = new AbortController()
        const fetchMe = async () => {
            setLoading(true)
            setError(null)
            try {
                const headers = { 'Accept': 'application/json' }
                if (token) headers['Authorization'] = `Bearer ${token}`

                const resp = await fetch('http://127.0.0.1:8080/api/me', {
                    method: 'GET',
                    headers,
                    signal: controller.signal
                })

                if (!resp.ok) {
                    const txt = await resp.text()
                    throw new Error(txt || `HTTP ${resp.status}`)
                }

                const data = await resp.json()
                setMe(data)
                // also update AuthContext so Layout and other components see the profile
                try { if (setProfile) setProfile(data) } catch (e) { }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch /api/me', err)
                    setError(err.message || 'Failed to load profile')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchMe()
        return () => controller.abort()
    }, [token])

    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">Dashboard</h2>
            </div>

            <div className="page-body">
                <h3>{isInstructor ? 'Instructor Dashboard (placeholder)' : 'Student Dashboard (placeholder)'}</h3>

                {loading && <p>Loading profile...</p>}
                {error && <p className="form-error">{error}</p>}

                {!loading && !error && me && (
                    <div className="profile-card">
                        <dl>
                            <dt>Display name (TH)</dt>
                            <dd>{me.displayname_th}</dd>

                            <dt>Display name (EN)</dt>
                            <dd>{me.displayname_en}</dd>

                            <dt>Username</dt>
                            <dd>{me.userName}</dd>

                            <dt>Prefix</dt>
                            <dd>{me.prefixname}</dd>

                            <dt>Email</dt>
                            <dd>{me.email}</dd>

                            <dt>Faculty</dt>
                            <dd>{me.faculty}</dd>

                            <dt>Department</dt>
                            <dd>{me.department}</dd>

                            <dt>Status</dt>
                            <dd>{me.statusname} ({me.statusid})</dd>

                            <dt>Type</dt>
                            <dd>{me.type}</dd>
                        </dl>
                    </div>
                )}

                {!loading && !error && !me && (
                    <p>No profile information available.</p>
                )}
            </div>
        </Layout>
    )
}
