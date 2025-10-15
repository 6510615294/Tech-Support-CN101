## Developer notes - login feature

To enable a local mock login (no backend required) set localStorage.MOCK_AUTH to '1' in your browser devtools. The frontend will accept any non-empty email/password and return a mock token.

- Files added/updated for the feature:
	- `src/services/auth.js` (mock fallback + real fetch)
	- `src/context/AuthContext.jsx` (auth provider, token/user state)
	- `src/pages/auth/Login.jsx` (login form)
	- `src/routes/PrivateRoute.jsx` (protect routes)
	- `src/__tests__/Login.test.jsx` (basic test scaffold)

Run tests (if project uses npm/yarn):

```bash
# npm
npm install
npm test

# or yarn
yarn install
yarn test
```

```
main (production-ready)
│
├── develop (integration branch)
│   │
│   ├── frontend/develop
│   │   ├── feature/login
│   │   ├── feature/instructor-dashboard
│   │   ├── feature/student-dashboard
│   │   ├── feature/assignment-management
│   │   ├── feature/code-editor
│   │   └── feature/reports
│   │
│   └── backend/develop
│       ├── feature/auth-api
│       ├── feature/assignment-api
│       ├── feature/course-api
│       ├── feature/ai-grading
│       └── feature/file-storage
│
├── hotfix/* (แก้บัคด่วน)
└── release/* (เตรียม deploy)
```

## 📋 รายละเอียด Branch Strategy

### 1. **Main Branches**

#### `main`
- โค้ดที่พร้อม production
- ต้อง stable เสมอ
- มี tag version (v1.0.0, v1.1.0)
- **ห้าม push โดยตรง** ต้อง merge ผ่าน Pull Request เท่านั้น

#### `develop`
- Branch สำหรับรวมงานทั้งหมด
- Integration testing ทำที่นี่
- Frontend + Backend merge เข้ามาที่นี่

---

### 2. **Layer Branches** (แนะนำสำหรับโครงงานนี้)

#### `frontend/develop`
- Branch หลักของ Frontend
- คนทำ Frontend ทำงานแยกจาก Backend
- รวม feature branches ต่างๆ ของ Frontend

#### `backend/develop`
- Branch หลักของ Backend
- คนทำ Backend ทำงานแยกจาก Frontend
- รวม feature branches ต่างๆ ของ Backend

**ข้อดี:**
- ✅ แยก Frontend/Backend ชัดเจน ไม่กระทบกัน
- ✅ แต่ละคนมี ownership ชัดเจน
- ✅ สามารถทำงานพร้อมกันได้โดยไม่ conflict
- ✅ Review code ง่ายขึ้น

---

### 3. **Feature Branches**

สร้างจาก `frontend/develop` หรือ `backend/develop`

#### Frontend Features:
```
feature/login                    # ระบบ Login
feature/instructor-dashboard     # Dashboard อาจารย์
feature/student-dashboard        # Dashboard นักศึกษา
feature/assignment-create        # สร้างการบ้าน
feature/assignment-submit        # ส่งการบ้าน
feature/assignment-grade         # ตรวจการบ้าน
feature/code-editor             # Code Editor Component
feature/course-management       # จัดการรายวิชา
feature/file-storage-ui         # UI คลังไฟล์
feature/reports                 # หน้ารายงาน
feature/settings                # หน้าตั้งค่า
```

#### Backend Features:
```
feature/auth-api               # API Authentication
feature/user-api              # API จัดการ User
feature/course-api            # API จัดการรายวิชา
feature/assignment-api        # API จัดการการบ้าน
feature/submission-api        # API ส่งงาน
feature/grading-api           # API ให้คะแนน
feature/ai-integration        # Integration กับ AI
feature/code-runner           # ระบบรันโค้ด
feature/file-storage-api      # API คลังไฟล์
feature/report-api            # API รายงาน
feature/ip-restriction        # IP Whitelist
```