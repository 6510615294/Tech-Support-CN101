import React from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
    const { user } = useAuth()
    const isInstructor = user && user.email && user.email.includes('instructor')

    return (
        <div>
            <h1>{isInstructor ? 'Instructor Dashboard (placeholder)' : 'Student Dashboard (placeholder)'}</h1>
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
    )
}
