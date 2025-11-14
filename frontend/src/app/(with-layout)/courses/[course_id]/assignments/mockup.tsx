type Assignment = {
  id: string
  title: string
  description: string
  point: number
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
}

const sampleAssignments: Assignment[] = [
  {
    id: "89e4312f-4120-4b4b-a861-0ad19a24dc9f",
    title: "Introduction to React Hooks",
    description: "Complete the tutorial on useState and useEffect hooks. Build a simple counter application and a data fetching component.",
    point: 10,
    start_date: "2025-11-06T17:00:00+07:00",
    due_date: "2025-11-21T06:59:59+07:00",
    close_date: "2025-12-05T07:00:00+07:00",
    tags: ["react", "hooks", "frontend"]
  },
  {
    id: "a3f5c8d2-9876-4321-b123-456789abcdef",
    title: "Database Design Assignment",
    description: "Design a normalized database schema for an e-commerce platform. Include ER diagrams and SQL create statements.",
    point: 25,
    start_date: "2025-11-08T09:00:00+07:00",
    due_date: "2025-11-25T23:59:59+07:00",
    close_date: "2025-12-10T23:59:59+07:00",
    tags: ["database", "sql", "design"]
  },
  {
    id: "b7e9f1a3-5432-1098-c456-789012345678",
    title: "API Development with Express",
    description: "Build a RESTful API with CRUD operations. Implement authentication and proper error handling.",
    point: 30,
    start_date: "2025-11-10T08:00:00+07:00",
    due_date: "2025-11-28T23:59:59+07:00",
    close_date: "2025-12-15T23:59:59+07:00",
    tags: ["api", "express", "backend", "nodejs"]
  },
  {
    id: "c4d8e2f6-7890-2345-d789-012345678901",
    title: "CSS Grid Layout Challenge",
    description: "Create a responsive portfolio layout using CSS Grid. Must work on mobile, tablet, and desktop screens.",
    point: 15,
    start_date: "2025-11-05T10:00:00+07:00",
    due_date: "2025-11-18T23:59:59+07:00",
    close_date: "2025-11-30T23:59:59+07:00",
    tags: ["css", "responsive", "frontend"]
  },
  {
    id: "d9e5f3a7-1234-5678-e901-234567890123",
    title: "Unit Testing Workshop",
    description: "Write comprehensive unit tests for the provided codebase using Jest. Achieve at least 80% code coverage.",
    point: 20,
    start_date: "2025-11-12T09:00:00+07:00",
    due_date: "2025-11-30T23:59:59+07:00",
    close_date: "2025-12-14T23:59:59+07:00",
    tags: ["testing", "jest", "quality"]
  },
  {
    id: "e1f6g4b8-2345-6789-f012-345678901234",
    title: "Algorithm Analysis",
    description: "Analyze time and space complexity of sorting algorithms. Implement quicksort and mergesort with benchmarks.",
    point: 35,
    start_date: "2025-11-15T08:00:00+07:00",
    due_date: "2025-12-05T23:59:59+07:00",
    close_date: "2025-12-20T23:59:59+07:00",
    tags: ["algorithms", "performance", "analysis"]
  },
  {
    id: "f2g7h5c9-3456-7890-g123-456789012345",
    title: "Docker Containerization",
    description: "Containerize a full-stack application using Docker. Create docker-compose file for local development.",
    point: 18,
    start_date: "2025-11-09T10:00:00+07:00",
    due_date: "2025-11-26T23:59:59+07:00",
    close_date: "2025-12-08T23:59:59+07:00",
    tags: ["docker", "devops", "deployment"]
  },
  {
    id: "g3h8i6d0-4567-8901-h234-567890123456",
    title: "Security Audit Report",
    description: "Conduct a security audit of the provided web application. Document vulnerabilities and recommend fixes.",
    point: 40,
    start_date: "2025-11-11T09:00:00+07:00",
    due_date: "2025-12-01T23:59:59+07:00",
    close_date: "2025-12-18T23:59:59+07:00",
    tags: ["security", "audit", "vulnerability"]
  },
  {
    id: "h4i9j7e1-5678-9012-i345-678901234567",
    title: "GraphQL Integration",
    description: "Replace existing REST endpoints with GraphQL. Implement queries, mutations, and subscriptions.",
    point: 28,
    start_date: "2025-11-13T08:00:00+07:00",
    due_date: "2025-12-03T23:59:59+07:00",
    close_date: "2025-12-17T23:59:59+07:00",
    tags: ["graphql", "api", "backend"]
  },
  {
    id: "i5j0k8f2-6789-0123-j456-789012345678",
    title: "Accessibility Improvements",
    description: "Audit and improve website accessibility. Ensure WCAG 2.1 AA compliance for all pages.",
    point: 22,
    start_date: "2025-11-07T10:00:00+07:00",
    due_date: "2025-11-24T23:59:59+07:00",
    close_date: "2025-12-06T23:59:59+07:00",
    tags: ["accessibility", "wcag", "frontend", "ux"]
  }
]

export type { Assignment }
export { sampleAssignments }