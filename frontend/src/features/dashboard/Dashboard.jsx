import React from 'react'
import { useAuth } from '../auth/AuthContext'
import Layout from '../../components/Layout'

export default function Dashboard() {
    const { user } = useAuth()
    const isInstructor = user && user.email && user.email.includes('instructor')

    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">Dashboard</h2>
            </div>

            <div>
                <h3>{isInstructor ? 'Instructor Dashboard (placeholder)' : 'Student Dashboard (placeholder)'}</h3>
                {isInstructor ? (
                    <div>
                        <p><a href="/dashboard/courses">Go to Courses</a></p>
                    </div>
                ) : (
                    <div>
                        <p>Student courses will appear here.</p>
                    </div>
                )}
            </div>
        </Layout>
    )
}
