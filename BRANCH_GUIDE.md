# 📚 คู่มือการใช้งาน Git Branches สำหรับโครงงาน

## 🎯 Introduction: โครงสร้าง Branch ของโครงงาน

โครงงานนี้ใช้ **Git Flow Strategy แบบ Hybrid** ที่ผสมผสานระหว่างการแยกตาม Layer (Frontend/Backend) และ Feature เพื่อให้ทีมสามารถทำงานแยกกันได้อย่างมีประสิทธิภาพ

---

## 🌳 Branch Structure Overview

```
main (production)
│
├── develop (integration)
│   │
│   ├── frontend/develop (Frontend Layer)
│   │   ├── feature/login
│   │   ├── feature/instructor-dashboard
│   │   ├── feature/student-dashboard
│   │   └── feature/...
│   │
│   └── backend/develop (Backend Layer)
│       ├── feature/auth-api
│       ├── feature/assignment-api
│       └── feature/...
│
├── hotfix/* (แก้บัคด่วน)
└── release/* (เตรียม production)
```

---

## 📖 คู่มือแต่ละ Branch

---

## 1. 🏠 **main** - Production Branch

### **คืออะไร?**
- Branch หลักที่เก็บโค้ดที่พร้อม production
- โค้ดใน branch นี้ต้อง **stable และ tested** เสมอ
- มี version tags (v1.0.0, v1.1.0, v2.0.0)

### **ใครใช้?**
- ทีมทั้งหมด (แต่ **ห้าม push โดยตรง**)
- เฉพาะ Merge จาก `develop` หรือ `hotfix/*` เท่านั้น

### **เมื่อไหร่ใช้?**
- เมื่อพร้อม deploy production
- เมื่อต้องการแก้บัคด่วน (hotfix)
- เมื่อต้องการ release version ใหม่

### **วิธีใช้งาน:**

```bash
# ❌ ห้ามทำ - Push โดยตรง
git checkout main
git commit -m "something"  # ❌ NEVER DO THIS

# ✅ ทำแบบนี้แทน - สร้าง Pull Request
# จาก develop → main
# หรือ hotfix/xxx → main
```

### **Branch Protection Rules:**
- ✅ Require pull request reviews (1+ approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ No force push allowed

### **Version Tagging:**
```bash
# เมื่อ merge เข้า main แล้ว
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 2. 🔄 **develop** - Integration Branch

### **คืออะไร?**
- Branch สำหรับรวมงานจาก Frontend และ Backend
- เป็นที่ทดสอบ integration ระหว่าง Frontend ↔ Backend
- พร้อม merge เข้า `main` เมื่อผ่านการทดสอบแล้ว

### **ใครใช้?**
- ทีมทั้งหมด (สำหรับ integration testing)
- Merge จาก `frontend/develop` และ `backend/develop`

### **เมื่อไหร่ใช้?**
- ทุกสัปดาห์ หรือเมื่อเสร็จ Sprint
- เมื่อต้องการทดสอบ Frontend + Backend ร่วมกัน
- ก่อน release เข้า production

### **วิธีใช้งาน:**

```bash
# ตรวจสอบ develop ล่าสุด
git checkout develop
git pull origin develop

# รัน integration tests
npm run test:integration  # หรือคำสั่งที่ตั้งไว้

# ถ้าผ่านแล้ว พร้อม merge เข้า main
```

### **Integration Flow:**
```bash
# สัปดาห์ละครั้ง หรือเมื่อเสร็จ Sprint

# 1. Merge Frontend
# สร้าง PR: frontend/develop → develop

# 2. Merge Backend  
# สร้าง PR: backend/develop → develop

# 3. Test ทั้งระบบ
# รัน E2E tests, Integration tests

# 4. ถ้าผ่านทั้งหมด
# สร้าง PR: develop → main
```

### **Branch Protection Rules:**
- ✅ Require pull request reviews
- ✅ Require CI/CD tests to pass
- ✅ Require branches to be up to date

---

## 3. 💻 **frontend/develop** - Frontend Layer Branch

### **คืออะไร?**
- Branch หลักสำหรับงาน Frontend ทั้งหมด
- รวม features ทั้งหมดของ Frontend ก่อน merge เข้า `develop`
- คนทำ Frontend มี ownership branch นี้

### **ใครใช้?**
- **Frontend Developer** (รับผิดชอบหลัก)
- Backend Developer (ดูเพื่ออ้างอิง API calls)

### **เมื่อไหร่ใช้?**
- เมื่อเสร็จ feature ใดๆ ของ Frontend
- ก่อน merge เข้า `develop`
- เมื่อต้องการ sync features หลายๆ อันเข้าด้วยกัน

### **วิธีใช้งาน:**

```bash
# เริ่มทำ feature ใหม่
git checkout frontend/develop
git pull origin frontend/develop
git checkout -b feature/instructor-dashboard

# ทำงาน...
# (ดู feature branch section ด้านล่าง)

# เมื่อเสร็จแล้ว
git push origin feature/instructor-dashboard

# สร้าง PR: feature/instructor-dashboard → frontend/develop
```

### **หน้าที่หลัก:**
- ✅ จัดการ UI/UX Components
- ✅ เชื่อมต่อ Backend API
- ✅ State Management
- ✅ Routing
- ✅ Form Validation
- ✅ Frontend Testing

### **Branch Protection Rules:**
- ✅ Require pull request reviews (1 approval)
- ✅ Require tests to pass
- ✅ Require branch up to date

### **Tech Stack (ตัวอย่าง):**
```
- React 18+ / Vue 3+ / Next.js
- TailwindCSS / Material-UI
- React Router / Vue Router
- Axios / Fetch API
- React Query / SWR
- Jest + React Testing Library
```

---

## 4. 🔧 **backend/develop** - Backend Layer Branch

### **คืออะไร?**
- Branch หลักสำหรับงาน Backend ทั้งหมด
- รวม features ทั้งหมดของ Backend ก่อน merge เข้า `develop`
- คนทำ Backend มี ownership branch นี้

### **ใครใช้?**
- **Backend Developer** (รับผิดชอบหลัก)
- Frontend Developer (ดูเพื่อเข้าใจ API endpoints)

### **เมื่อไหร่ใช้?**
- เมื่อเสร็จ feature ใดๆ ของ Backend
- ก่อน merge เข้า `develop`
- เมื่อต้องการ sync API endpoints หลายๆ อัน

### **วิธีใช้งาน:**

```bash
# เริ่มทำ feature ใหม่
git checkout backend/develop
git pull origin backend/develop
git checkout -b feature/auth-api

# ทำงาน...
# (ดู feature branch section ด้านล่าง)

# เมื่อเสร็จแล้ว
git push origin feature/auth-api

# สร้าง PR: feature/auth-api → backend/develop
```

### **หน้าที่หลัก:**
- ✅ สร้าง RESTful APIs / GraphQL
- ✅ Database Design & Management
- ✅ Authentication & Authorization
- ✅ Business Logic
- ✅ AI Integration
- ✅ Backend Testing

### **Branch Protection Rules:**
- ✅ Require pull request reviews (1 approval)
- ✅ Require tests to pass
- ✅ Require branch up to date

### **Tech Stack (ตัวอย่าง):**
```
- Node.js + Express / FastAPI (Python)
- PostgreSQL / MongoDB
- JWT Authentication
- OpenAI API / Anthropic Claude API
- Jest / Pytest
- Docker (optional)
```

---

## 5. 🌿 **feature/** - Feature Branches

### **คืออะไร?**
- Branch สำหรับพัฒนา feature เดียวๆ
- มีอายุสั้น (3-5 วัน)
- ถูกลบหลังจาก merge แล้ว

### **Naming Convention:**

```bash
# Frontend Features
feature/login
feature/instructor-dashboard
feature/student-dashboard
feature/assignment-create
feature/assignment-submit
feature/assignment-grade
feature/code-editor
feature/course-management
feature/file-storage-ui
feature/reports
feature/settings

# Backend Features
feature/auth-api
feature/user-api
feature/course-api
feature/assignment-api
feature/submission-api
feature/grading-api
feature/ai-integration
feature/code-runner
feature/file-storage-api
feature/report-api
feature/ip-restriction
```

### **วิธีใช้งาน:**

#### **Frontend Feature:**
```bash
# 1. สร้าง branch
git checkout frontend/develop
git pull origin frontend/develop
git checkout -b feature/login

# 2. ทำงาน
# สร้างไฟล์ใหม่
mkdir -p src/pages/auth
touch src/pages/auth/LoginPage.jsx

# เขียนโค้ด...

# 3. Commit (commit บ่อยๆ)
git add .
git commit -m "feat: add login page layout"

git add .
git commit -m "feat: add login form validation"

git add .
git commit -m "feat: integrate login API"

# 4. Push
git push origin feature/login

# 5. สร้าง Pull Request
# ไปที่ GitHub → Pull Requests → New PR
# Base: frontend/develop
# Compare: feature/login

# 6. หลัง Merge แล้ว
git checkout frontend/develop
git pull origin frontend/develop
git branch -d feature/login  # ลบ local branch
```

#### **Backend Feature:**
```bash
# 1. สร้าง branch
git checkout backend/develop
git pull origin backend/develop
git checkout -b feature/auth-api

# 2. ทำงาน
mkdir -p src/routes src/controllers
touch src/routes/auth.js
touch src/controllers/authController.js

# เขียนโค้ด...

# 3. Commit
git add .
git commit -m "feat: add auth routes structure"

git add .
git commit -m "feat: implement login endpoint"

git add .
git commit -m "feat: add JWT token generation"

git add .
git commit -m "test: add auth API tests"

# 4. Push
git push origin feature/auth-api

# 5. สร้าง Pull Request
# Base: backend/develop
# Compare: feature/auth-api

# 6. หลัง Merge
git checkout backend/develop
git pull origin backend/develop
git branch -d feature/auth-api
```

### **Best Practices:**
- ✅ **1 Feature = 1 Branch** - อย่ารวมหลาย features
- ✅ **Commit บ่อยๆ** - แต่แต่ละ commit ต้องมีความหมาย
- ✅ **Pull ก่อนทำงานทุกวัน** - sync code ล่าสุด
- ✅ **Test ก่อน Push** - ต้องรันได้ไม่มี error
- ✅ **Merge เร็ว** - ภายใน 3-5 วัน
- ✅ **ลบหลัง Merge** - เก็บ branch ให้สะอาด

---

## 6. 🚨 **hotfix/** - Hotfix Branches

### **คืออะไร?**
- Branch สำหรับแก้บัคด่วนใน production
- สร้างจาก `main` และ merge กลับเข้า `main` + `develop`
- ใช้เฉพาะเมื่อมีปัญหาร้ายแรงใน production

### **เมื่อไหร่ใช้?**
- เมื่อพบบัคร้ายแรงใน production (main)
- ต้องแก้ไขทันที ไม่รอถึง release ปกติ
- ผู้ใช้งานได้รับผลกระทบ

### **Naming Convention:**
```bash
hotfix/fix-login-bug
hotfix/fix-database-connection
hotfix/fix-security-vulnerability
```

### **วิธีใช้งาน:**

```bash
# 1. สร้าง hotfix branch จาก main
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-bug

# 2. แก้บัค
# แก้ไขโค้ด...

# 3. Test ให้แน่ใจว่าแก้แล้ว
npm test

# 4. Commit
git add .
git commit -m "fix: resolve login authentication bug"

# 5. Push
git push origin hotfix/fix-login-bug

# 6. สร้าง PR → main
# Base: main
# Compare: hotfix/fix-login-bug

# 7. หลัง Merge เข้า main แล้ว
# ต้อง merge เข้า develop ด้วย
git checkout develop
git pull origin develop
git merge main
git push origin develop

# 8. ลบ branch
git branch -d hotfix/fix-login-bug
git push origin --delete hotfix/fix-login-bug

# 9. Tag version ใหม่
git checkout main
git tag -a v1.0.1 -m "Hotfix: fix login bug"
git push origin v1.0.1
```

### **⚠️ ข้อควรระวัง:**
- ใช้เฉพาะกรณีฉุกเฉินเท่านั้น
- ต้อง merge กลับเข้าทั้ง `main` และ `develop`
- ต้อง test อย่างละเอียด
- ต้องสื่อสารกับทีมทั้งหมด

---

## 7. 🎁 **release/** - Release Branches

### **คืออะไร?**
- Branch สำหรับเตรียม release version ใหม่
- สร้างจาก `develop` เมื่อพร้อม release
- ทำ final testing และแก้บัคเล็กน้อย

### **เมื่อไหร่ใช้?**
- เมื่อ features ใน develop ครบตามแผน
- พร้อม release version ใหม่
- ต้องการทำ final checks

### **Naming Convention:**
```bash
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

### **วิธีใช้งาน:**

```bash
# 1. สร้าง release branch จาก develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Update version numbers
# แก้ไข package.json, version files

# 3. Final testing
npm run test
npm run build

# 4. แก้บัคเล็กน้อย (ถ้ามี)
git commit -m "fix: minor bug in release v1.0.0"

# 5. Push
git push origin release/v1.0.0

# 6. สร้าง PR → main
# Base: main
# Compare: release/v1.0.0

# 7. หลัง Merge เข้า main
# Merge กลับเข้า develop ด้วย
git checkout develop
git merge release/v1.0.0
git push origin develop

# 8. Tag version
git checkout main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 9. ลบ branch
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

---

## 📊 Branch Lifecycle Diagram

```
┌─────────────────────────────────────────────────────┐
│ Feature Development (1-5 days)                      │
│                                                     │
│  feature/xxx ──→ frontend/develop                  │
│              ──→ backend/develop                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Integration (Weekly)                                │
│                                                     │
│  frontend/develop ──→ develop                      │
│  backend/develop  ──→ develop                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Release (When ready)                                │
│                                                     │
│  develop ──→ release/vX.X.X ──→ main               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Hotfix (Emergency only)                             │
│                                                     │
│  main ──→ hotfix/xxx ──→ main + develop           │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Command Reference

### ทุกวัน (Daily):
```bash
# เริ่มงาน
git checkout frontend/develop  # หรือ backend/develop
git pull origin frontend/develop

# สร้าง feature
git checkout -b feature/new-feature

# Commit งาน
git add .
git commit -m "feat: add something"
git push origin feature/new-feature
```

### ทุกสัปดาห์ (Weekly Integration):
```bash
# Merge features → layer branch
# สร้าง PR: feature/xxx → frontend/develop

# Merge layers → develop
# สร้าง PR: frontend/develop → develop
# สร้าง PR: backend/develop → develop
```

### เมื่อพร้อม Release:
```bash
# สร้าง release
git checkout develop
git checkout -b release/v1.0.0

# Final checks → merge → main
# Tag version
```

---

## 📝 Commit Message Convention

ใช้ **Conventional Commits**:

```bash
feat: เพิ่ม feature ใหม่
fix: แก้บัค
docs: แก้เอกสาร
style: แก้ formatting
refactor: ปรับโครงสร้าง
test: เพิ่ม tests
chore: งานอื่นๆ (config, dependencies)
perf: ปรับปรุง performance
ci: แก้ CI/CD
```

**ตัวอย่าง:**
```bash
git commit -m "feat: add login page with SSO integration"
git commit -m "fix: resolve infinite loop in assignment list"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for auth controller"
git commit -m "refactor: extract validation logic to utils"
```

---

## ❓ FAQ

**Q: ถ้าลืมว่าอยู่ branch ไหน?**
```bash
git branch  # ดู local branches
git status  # ดูสถานะปัจจุบัน
```

**Q: ถ้าทำงานผิด branch?**
```bash
# ย้าย commit ล่าสุดไป branch ที่ถูก
git checkout correct-branch
git cherry-pick <commit-hash>

# ลบ commit จาก branch เก่า
git checkout wrong-branch
git reset --hard HEAD~1
```

**Q: ถ้า feature branch ล้าหลังจาก develop?**
```bash
git checkout feature/my-feature
git fetch origin
git rebase frontend/develop  # หรือ backend/develop
git push origin feature/my-feature --force-with-lease
```

**Q: ลืม pull ก่อนทำงาน ตอนนี้ conflict?**
```bash
git pull origin frontend/develop
# แก้ conflict ในไฟล์
git add .
git commit
git push
```

**Q: ต้องการดึง code จาก branch อื่นมาใช้?**
```bash
# ดึงเฉพาะ commit เดียว
git checkout your-branch
git cherry-pick <commit-hash>

# ดึงไฟล์เฉพาะจาก branch อื่น
git checkout other-branch -- path/to/file
```

**Q: ต้องการยกเลิก commit ล่าสุด?**
```bash
# ยกเลิกแต่เก็บการแก้ไข
git reset --soft HEAD~1

# ยกเลิกและลบการแก้ไขทั้งหมด
git reset --hard HEAD~1
```

**Q: Push ไปแล้ว แต่ต้องการแก้ไข commit message?**
```bash
git commit --amend -m "new commit message"
git push origin branch-name --force-with-lease
```

---

## 🔒 Security Best Practices

### ไฟล์ที่ **ห้าม** commit:
```
.env
.env.local
.env.production
config/secrets.json
*.key
*.pem
node_modules/
__pycache__/
.vscode/settings.json (ถ้ามี token)
```

### ตรวจสอบก่อน commit:
```bash
# ดูว่าจะ commit อะไรบ้าง
git status
git diff

# ตรวจสอบว่ามีไฟล์ sensitive หรือไม่
git diff --cached | grep -i "password\|secret\|token\|key"
```

### ถ้า commit ไฟล์ sensitive ไปแล้ว:
```bash
# ลบไฟล์ออกจาก Git แต่เก็บไว้ใน local
git rm --cached .env
git commit -m "chore: remove .env from git"
git push

# ถ้า push ไปแล้ว ต้อง:
# 1. เปลี่ยน secrets/tokens ทั้งหมดทันที
# 2. ใช้ git filter-branch หรือ BFG Repo-Cleaner (ซับซ้อน)
```

---

## 📚 Additional Resources

### Git Commands Cheat Sheet:
```bash
# ดู branch ทั้งหมด
git branch -a

# ลบ branch local
git branch -d branch-name

# ลบ branch remote
git push origin --delete branch-name

# ดู commit history สวยๆ
git log --oneline --graph --all --decorate

# ดู changes ระหว่าง branches
git diff branch1..branch2

# Stash การแก้ไข (เก็บไว้ชั่วคราว)
git stash
git stash pop

# ดู remote URL
git remote -v

# เปลี่ยน remote URL
git remote set-url origin new-url
```

### GitHub CLI (gh):
```bash
# Install: https://cli.github.com/

# สร้าง PR จาก command line
gh pr create --base frontend/develop --head feature/login

# ดู PR ทั้งหมด
gh pr list

# Review PR
gh pr review <PR-number> --approve
```

---

## 🎓 Training Exercises

### Exercise 1: Basic Feature Flow
```bash
# 1. สร้าง feature branch
git checkout frontend/develop
git checkout -b feature/test-exercise

# 2. สร้างไฟล์ใหม่
echo "console.log('Hello')" > test.js

# 3. Commit
git add test.js
git commit -m "feat: add test file"

# 4. Push
git push origin feature/test-exercise

# 5. ลบ branch (หลังฝึกเสร็จ)
git checkout frontend/develop
git branch -d feature/test-exercise
git push origin --delete feature/test-exercise
```

### Exercise 2: Handling Conflicts
```bash
# จงทำให้เกิด conflict แล้วแก้ไข
# (ฝึกกับทีม)
```

---

## 📞 Contact & Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ FAQ ในเอกสารนี้ก่อน
2. ถามเพื่อนร่วมทีม
3. ถามอาจารย์ที่ปรึกษา
4. Google: "git [problem]"
5. Stack Overflow

---

**เอกสารนี้ควรอยู่ที่:** `docs/BRANCH_GUIDE.md` หรือ `BRANCH_GUIDE.md` ใน root ของ repository

**Last Updated:** 2024
**Version:** 1.0