import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../auth/AuthContext'

export default function CoursesPage() {
    const { token } = useAuth()
    const [courses, setCourses] = useState([])
    const [showAdd, setShowAdd] = useState(false)
    const [newId, setNewId] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState(null)

    useEffect(() => {
        let mounted = true
        const controller = new AbortController()
        const fetchCourses = async () => {
            try {
                const headers = { Accept: 'application/json' }
                if (token) headers['Authorization'] = `Bearer ${token}`

                const resp = await fetch('http://127.0.0.1:8080/api/courses', {
                    method: 'GET',
                    headers,
                    signal: controller.signal
                })

                if (!resp.ok) {
                    // silently fail for now
                    return
                }

                const json = await resp.json()
                if (!mounted) return
                // accept either { data: [] } or plain array
                const data = Array.isArray(json) ? json : (json.data || [])
                setCourses(data)
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Failed to fetch courses', e)
                }
            }
        }

        fetchCourses()
        return () => {
            mounted = false
            controller.abort()
        }
    }, [token])

    const handleAdd = async (e) => {
        e && e.preventDefault()
        setMsg(null)
        if (!newId) return setMsg('กรุณากรอกรหัสคอร์ส')
        setLoading(true)
        try {
            const resp = await fetch('http://127.0.0.1:8080/api/courses/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ id: newId })
            })

            if (!resp.ok) {
                const text = await resp.text()
                setMsg(text || `Error ${resp.status}`)
            } else {
                const created = await resp.json()
                // normalize: if server returns { data: course }
                const course = created.data || created
                setCourses(prev => [course, ...prev])
                setNewId('')
                setShowAdd(false)
                setMsg('เพิ่มคอร์สสำเร็จ')
            }
        } catch (err) {
            console.error('Join course error', err)
            setMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">My Courses</h2>
            </div>

            <div className="page-body">
                <div className="courses-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div />
                    <div className="add-wrap" style={{ position: 'relative' }}>
                        <button className="icon-btn" onClick={() => setShowAdd(s => !s)} aria-expanded={showAdd} aria-haspopup="true">Add Courses</button>
                        {showAdd && (
                            <form className="add-dropdown" onSubmit={handleAdd} style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--color-bg)', padding: 12, borderRadius: 8, boxShadow: 'var(--shadow-md)', display: 'flex', gap: 8, zIndex: 300 }}>
                                <input placeholder="Course ID" value={newId} onChange={e => setNewId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)' }} />
                                <button type="submit" className="login-btn" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Adding…' : 'Add'}</button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16, marginTop: 16 }}>
                    {courses.length === 0 && <p>No courses yet.</p>}
                    {courses.map(c => (
                        <article key={c.id} className="course-card" style={{ background: 'var(--color-surface)', padding: 16, borderRadius: 10, boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(11,99,235,0.04)' }}>
                            <header className="course-card-head">
                                <h3 style={{ margin: '0 0 6px 0' }}>{c.name}</h3>
                                <div className="course-meta" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{c.course_date} • Sec {c.section} • {c.semester}</div>
                            </header>
                            <div className="course-card-body" style={{ marginTop: 12 }}>
                                <p>Course ID: <strong>{c.id}</strong></p>
                                <p>Teacher: {c.teacher_id}</p>
                            </div>
                            <footer className="course-card-foot" style={{ marginTop: 12 }}>
                                <small>Created: {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</small>
                            </footer>
                        </article>
                    ))}
                </div>

                {msg && <div className="form-error" style={{ marginTop: 12 }}>{msg}</div>}
            </div>
        </Layout>
    )
}
