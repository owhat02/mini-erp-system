# 김민희 파트 프론트 연동 가이드

프론트엔드에서 바로 붙일 수 있도록 프로젝트, Task, 대시보드 API를 정리한 문서입니다.

---

## 1. 범위

| 도메인 | 기능 |
|--------|------|
| 프로젝트 | 생성, 목록 조회, 수정, 팀장 변경, 팀원 관리, 권한 관리, 진행률 |
| Task | 생성, 목록 조회, 상세 조회, 수정, 상태 변경, 담당자 관리, 최근 배정 이력 |
| 대시보드 | 진행률, 관리자 요약, 프로젝트 현황 |

---

## 2. 공통 규칙

### 2.1 기본 정보

| 항목 | 값 |
|------|---|
| Base URL | `http://localhost:8080` |
| API Prefix | `/api/v1` |
| 인증 방식 | `Authorization: Bearer {accessToken}` |
| 날짜 형식 | `"YYYY-MM-DD"` (예: `"2026-04-01"`) |
| 시간 형식 | `"YYYY-MM-DDTHH:mm:ss"` (예: `"2026-04-03T09:00:00"`) |

### 2.2 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다.",
  "timestamp": "2026-04-03T09:00:00"
}
```

### 2.3 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "프로젝트를 찾을 수 없습니다."
  },
  "timestamp": "2026-04-03T09:00:00"
}
```

### 2.4 주요 에러 코드

| HTTP | code | message | 발생 상황 |
|------|------|---------|----------|
| 400 | `INVALID_INPUT_VALUE` | 잘못된 요청 값입니다. | 필수 필드 누락, 유효성 실패 |
| 400 | `INVALID_PROJECT_PERIOD` | 종료일은 시작일보다 빠를 수 없습니다. | 프로젝트 생성/수정 시 |
| 400 | `INVALID_TASK_PERIOD` | 업무 종료일은 시작일보다 빠를 수 없습니다. | Task 생성 시 |
| 401 | `UNAUTHORIZED` | 인증이 필요합니다. | 토큰 없음 |
| 401 | `INVALID_TOKEN` | 유효하지 않은 토큰입니다. | 토큰 만료/변조 |
| 403 | `ACCESS_DENIED` | 접근 권한이 없습니다. | 권한 부족 |
| 403 | `TASK_ACCESS_DENIED` | 본인에게 배정된 업무만 접근할 수 있습니다. | USER가 미배정 Task 접근 |
| 403 | `NO_ASSIGNED_PROJECT` | 배정된 프로젝트가 없습니다. | USER에게 프로젝트 미배정 |
| 404 | `PROJECT_NOT_FOUND` | 프로젝트를 찾을 수 없습니다. | 존재하지 않는 projectId |
| 404 | `TASK_NOT_FOUND` | 업무를 찾을 수 없습니다. | 존재하지 않는 taskId |
| 404 | `PROJECT_MEMBER_NOT_FOUND` | 프로젝트 팀원 정보를 찾을 수 없습니다. | 팀원 해제 시 대상 없음 |
| 404 | `ASSIGNMENT_NOT_FOUND` | 담당자 배정 정보를 찾을 수 없습니다. | 담당자 해제 시 대상 없음 |
| 409 | `DUPLICATE_RESOURCE` | 이미 존재하는 데이터입니다. | 팀원/담당자 중복 배정 |
| 409 | `DUPLICATE_PROJECT_MEMBER` | 이미 프로젝트에 배정된 팀원입니다. | 프로젝트 팀원 중복 |
| 409 | `DUPLICATE_ASSIGNMENT` | 이미 배정된 담당자입니다. | Task 담당자 중복 |

### 2.5 Enum 값

프론트에서 문자열 그대로 보내야 하는 값입니다.

| Enum | 값 |
|------|---|
| `Priority` | `HIGH`, `MEDIUM`, `LOW` |
| `ProjectStatus` | `READY`, `PROGRESS`, `DONE` |
| `TaskStatus` | `TODO`, `DOING`, `DONE` |

> **주의**: Task 관련 요청/응답에서 필드명은 `taskState`입니다. `taskStatus`로 보내면 안 됩니다.

### 2.6 역할(Role)별 접근 권한

| 역할 | 설명 |
|------|------|
| `ADMIN` | 모든 API 접근 가능 (관리소장) |
| `TEAM_LEADER` | 본인이 담당하는 프로젝트 범위 내에서 관리 가능 |
| `USER` | 본인에게 배정된 프로젝트/Task만 조회 가능, Task 상태 변경 가능 |

---

## 3. 프로젝트 API

### 3.1 프로젝트 생성

| 항목 | 값 |
|------|---|
| Method | `POST` |
| URL | `/api/v1/projects` |
| 권한 | ADMIN만 |
| 성공 코드 | `201 Created` |

Request:

```json
{
  "title": "ERP 구축",
  "content": "관리 시스템 구축 프로젝트",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "priority": "HIGH",
  "leaderId": 2
}
```

> `leaderId`는 필수값입니다. TEAM_LEADER 역할을 가진 사용자만 지정할 수 있습니다.

Response `data`:

```json
{
  "projectId": 1,
  "title": "ERP 구축",
  "content": "관리 시스템 구축 프로젝트",
  "status": "READY",
  "priority": "HIGH",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "memberCount": 0,
  "taskCount": 0,
  "progressRate": 0,
  "leaderId": 2,
  "leaderName": "홍길동"
}
```

---

### 3.2 프로젝트 목록 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects` |
| 권한 | 전체 (역할별 조회 범위 다름) |
| 성공 코드 | `200 OK` |

역할별 조회 범위:

| 역할 | 조회 범위 |
|------|----------|
| ADMIN | 모든 프로젝트 |
| TEAM_LEADER | 본인이 팀장인 프로젝트 |
| USER | 본인이 배정된 프로젝트 |

Response `data`:

```json
[
  {
    "projectId": 1,
    "title": "ERP 구축",
    "content": "관리 시스템 구축 프로젝트",
    "status": "PROGRESS",
    "priority": "HIGH",
    "startDate": "2026-04-01",
    "endDate": "2026-06-30",
    "memberCount": 5,
    "taskCount": 10,
    "progressRate": 40,
    "leaderId": 2,
    "leaderName": "홍길동"
  }
]
```

---

### 3.3 프로젝트 수정

| 항목 | 값 |
|------|---|
| Method | `PUT` |
| URL | `/api/v1/projects/{projectId}` |
| 권한 | ADMIN만 |
| 성공 코드 | `200 OK` |

Request:

```json
{
  "title": "ERP 구축 수정",
  "content": "프로젝트 설명 수정",
  "startDate": "2026-04-01",
  "endDate": "2026-07-15",
  "priority": "MEDIUM"
}
```

Response `data`:

```json
{
  "projectId": 1,
  "title": "ERP 구축 수정",
  "content": "프로젝트 설명 수정",
  "status": "PROGRESS",
  "priority": "MEDIUM",
  "startDate": "2026-04-01",
  "endDate": "2026-07-15",
  "memberCount": 5,
  "taskCount": 10,
  "progressRate": 40,
  "leaderId": 2,
  "leaderName": "홍길동"
}
```

> `status`와 `leader`는 이 API로 변경되지 않습니다.

---

### 3.4 프로젝트 팀장 변경

| 항목 | 값 |
|------|---|
| Method | `PATCH` |
| URL | `/api/v1/projects/{projectId}/leader` |
| 권한 | ADMIN만 |
| 성공 코드 | `200 OK` |

Request:

```json
{
  "leaderId": 3
}
```

Response `data`:

```json
{
  "projectId": 1,
  "title": "ERP 구축",
  "content": "관리 시스템 구축 프로젝트",
  "status": "PROGRESS",
  "priority": "HIGH",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "memberCount": 5,
  "taskCount": 10,
  "progressRate": 40,
  "leaderId": 3,
  "leaderName": "이팀장"
}
```

> `leaderId`는 TEAM_LEADER 역할을 가진 사용자만 지정할 수 있습니다.

---

### 3.5 프로젝트 팀원 배정

| 항목 | 값 |
|------|---|
| Method | `POST` |
| URL | `/api/v1/projects/{projectId}/members` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `201 Created` |

Request:

```json
{
  "userId": 5
}
```

Response `data`:

```json
{
  "id": 10,
  "projectId": 1,
  "userId": 5,
  "userName": "김철수"
}
```

> 이미 배정된 팀원이면 `409 DUPLICATE_PROJECT_MEMBER`

---

### 3.6 프로젝트 팀원 해제

| 항목 | 값 |
|------|---|
| Method | `DELETE` |
| URL | `/api/v1/projects/{projectId}/members/{userId}` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `204 No Content` |

> 응답 body가 없습니다. 대상이 없으면 `404 PROJECT_MEMBER_NOT_FOUND`

---

### 3.7 프로젝트 팀원 목록 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/{projectId}/members` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
[
  {
    "id": 10,
    "projectId": 1,
    "userId": 5,
    "userName": "김철수"
  }
]
```

---

### 3.8 프로젝트에 추가 가능한 팀원 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/{projectId}/members/available` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `200 OK` |

> 이미 배정된 팀원은 제외됩니다.

Response `data`:

```json
[
  {
    "userId": 5,
    "userName": "김철수"
  }
]
```

---

### 3.9 Task에 배정 가능한 팀원 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/{projectId}/members/assignable` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `200 OK` |

> 해당 프로젝트에 배정된 팀원만 반환됩니다. Task 담당자 배정 시 이 목록을 사용하세요.

Response `data`:

```json
[
  {
    "userId": 5,
    "userName": "김철수",
    "positionName": "사원"
  }
]
```

---

### 3.10 사용자별 프로젝트 권한 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/permissions/{userId}` |
| 권한 | ADMIN + TEAM_LEADER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
[
  {
    "projectId": 1,
    "title": "ERP 구축",
    "status": "PROGRESS",
    "assigned": true
  },
  {
    "projectId": 2,
    "title": "인사 시스템",
    "status": "READY",
    "assigned": false
  }
]
```

> `assigned: true`인 프로젝트가 해당 사용자에게 현재 배정된 프로젝트입니다.

---

### 3.11 사용자별 프로젝트 권한 저장

| 항목 | 값 |
|------|---|
| Method | `PUT` |
| URL | `/api/v1/projects/permissions/{userId}` |
| 권한 | ADMIN + TEAM_LEADER |
| 성공 코드 | `200 OK` |

Request:

```json
{
  "assignedProjectIds": [1, 2, 3]
}
```

> 전체 선택값을 배열로 한 번에 보냅니다. 기존 배정을 이 목록으로 덮어씁니다.

Response `data`:

```json
[
  {
    "projectId": 1,
    "title": "ERP 구축",
    "status": "PROGRESS",
    "assigned": true
  },
  {
    "projectId": 2,
    "title": "인사 시스템",
    "status": "READY",
    "assigned": true
  },
  {
    "projectId": 3,
    "title": "회계 시스템",
    "status": "READY",
    "assigned": true
  }
]
```

---

### 3.12 팀장 목록 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/leaders` |
| 권한 | ADMIN만 |
| 성공 코드 | `200 OK` |

> 프로젝트 생성/팀장 변경 시 팀장 선택 드롭다운에 사용하세요.

Response `data`:

```json
[
  {
    "userId": 3,
    "userName": "이팀장",
    "assignedProjectCount": 2
  }
]
```

---

### 3.13 프로젝트 진행률 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/projects/{projectId}/progress` |
| 권한 | ADMIN + 담당 TEAM_LEADER + 배정된 USER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
{
  "projectId": 1,
  "totalTasks": 10,
  "doneTasks": 4,
  "progressRate": 40
}
```

---

## 4. Task API

### 4.1 Task 생성

| 항목 | 값 |
|------|---|
| Method | `POST` |
| URL | `/api/v1/tasks` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `201 Created` |

Request:

```json
{
  "projectId": 1,
  "taskTitle": "로그인 화면 구현",
  "taskContent": "디자인 반영 및 API 연동",
  "endDate": "2026-04-15",
  "taskState": "TODO",
  "priority": "HIGH",
  "assigneeIds": [5, 6]
}
```

Response `data`:

```json
{
  "id": 1,
  "projectId": 1,
  "taskTitle": "로그인 화면 구현",
  "taskContent": "디자인 반영 및 API 연동",
  "taskState": "TODO",
  "priority": "HIGH",
  "endDate": "2026-04-15",
  "assignees": [
    { "id": 5, "userName": "김철수" },
    { "id": 6, "userName": "박영희" }
  ]
}
```

---

### 4.2 Task 목록 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/tasks` |
| 권한 | 전체 (역할별 조회 범위 다름) |
| 성공 코드 | `200 OK` |

역할별 조회 범위:

| 역할 | 조회 범위 |
|------|----------|
| ADMIN | 모든 Task |
| TEAM_LEADER | 본인 담당 프로젝트의 Task |
| USER | 본인에게 배정된 Task만 |

Response `data`:

```json
[
  {
    "id": 1,
    "projectId": 1,
    "taskTitle": "로그인 화면 구현",
    "taskContent": "디자인 반영 및 API 연동",
    "taskState": "TODO",
    "priority": "HIGH",
    "endDate": "2026-04-15",
    "assignees": [
      { "id": 5, "userName": "김철수" }
    ]
  }
]
```

---

### 4.3 Task 상세 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/tasks/{taskId}` |
| 권한 | ADMIN + 담당 TEAM_LEADER + 배정된 USER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
{
  "id": 1,
  "projectId": 1,
  "taskTitle": "로그인 화면 구현",
  "taskContent": "디자인 반영 및 API 연동",
  "taskState": "DOING",
  "priority": "HIGH",
  "endDate": "2026-04-15",
  "assignees": [
    { "id": 5, "userName": "김철수" },
    { "id": 6, "userName": "박영희" }
  ]
}
```

> USER는 본인에게 배정된 Task만 조회 가능합니다. 미배정 Task 접근 시 `403 TASK_ACCESS_DENIED`

---

### 4.4 Task 수정

| 항목 | 값 |
|------|---|
| Method | `PUT` |
| URL | `/api/v1/tasks/{taskId}` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `200 OK` |

Request:

```json
{
  "taskTitle": "로그인 화면 구현 수정",
  "taskContent": "API 명세 반영 완료",
  "endDate": "2026-04-18",
  "priority": "MEDIUM"
}
```

Response `data`:

```json
{
  "id": 1,
  "projectId": 1,
  "taskTitle": "로그인 화면 구현 수정",
  "taskContent": "API 명세 반영 완료",
  "taskState": "DOING",
  "priority": "MEDIUM",
  "endDate": "2026-04-18",
  "assignees": [
    { "id": 5, "userName": "김철수" }
  ]
}
```

> `taskState`, 담당자, `projectId`는 이 API로 변경되지 않습니다.

---

### 4.5 Task 상태 변경

| 항목 | 값 |
|------|---|
| Method | `PATCH` |
| URL | `/api/v1/tasks/{taskId}/status` |
| 권한 | ADMIN + 담당 TEAM_LEADER + 배정된 USER |
| 성공 코드 | `200 OK` |

Request:

```json
{
  "taskState": "DOING"
}
```

Response `data`:

```json
{
  "id": 1,
  "projectId": 1,
  "taskTitle": "로그인 화면 구현",
  "taskContent": "디자인 반영 및 API 연동",
  "taskState": "DOING",
  "priority": "HIGH",
  "endDate": "2026-04-15",
  "assignees": [
    { "id": 5, "userName": "김철수" }
  ]
}
```

> 칸반보드 드래그 시 이 API를 호출하세요. `taskState` 값: `TODO` / `DOING` / `DONE`

---

### 4.6 Task 담당자 배정

| 항목 | 값 |
|------|---|
| Method | `POST` |
| URL | `/api/v1/tasks/{taskId}/assignments` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `201 Created` |

Request:

```json
{
  "userId": 5
}
```

Response `data`:

```json
{
  "id": 15,
  "taskId": 1,
  "userId": 5
}
```

> 이미 배정된 담당자면 `409 DUPLICATE_ASSIGNMENT`

---

### 4.7 Task 담당자 목록 조회

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/tasks/{taskId}/assignments` |
| 권한 | ADMIN + 담당 TEAM_LEADER + 배정된 USER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
[
  {
    "id": 15,
    "taskId": 1,
    "userId": 5
  }
]
```

---

### 4.8 Task 담당자 해제

| 항목 | 값 |
|------|---|
| Method | `DELETE` |
| URL | `/api/v1/tasks/{taskId}/assignments/{userId}` |
| 권한 | ADMIN + 담당 TEAM_LEADER |
| 성공 코드 | `204 No Content` |

> 응답 body가 없습니다. 대상이 없으면 `404 ASSIGNMENT_NOT_FOUND`

---

### 4.9 최근 업무 배정 이력

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/tasks/recent-assignments` |
| 권한 | ADMIN + TEAM_LEADER |
| 성공 코드 | `200 OK` |

Response `data`:

```json
[
  {
    "taskId": 1,
    "taskTitle": "로그인 화면 구현",
    "projectTitle": "ERP 구축",
    "assigneeName": "김철수",
    "endDate": "2026-04-15",
    "priority": "HIGH",
    "createdAt": "2026-04-03T09:00:00"
  }
]
```

---

## 5. 대시보드 API

### 5.1 대시보드 진행률

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/dashboard/progress` |
| 권한 | 전체 (역할별 집계 범위 다름) |
| 성공 코드 | `200 OK` |

역할별 집계 범위:

| 역할 | 집계 범위 |
|------|----------|
| ADMIN | 전체 Task |
| TEAM_LEADER | 본인 담당 프로젝트의 Task |
| USER | 본인에게 배정된 Task |

Response `data`:

```json
{
  "todoCount": 5,
  "doingCount": 3,
  "doneCount": 2,
  "progressRate": 20.0
}
```

---

### 5.2 관리자 요약

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/dashboard/admin-summary` |
| 권한 | ADMIN + TEAM_LEADER (USER는 접근 불가) |
| 성공 코드 | `200 OK` |

Response `data`:

```json
{
  "totalUsers": 12,
  "activeProjectCount": 3,
  "pendingApprovalCount": 4,
  "taskCompletionRate": 42.5,
  "totalTaskCount": 40
}
```

---

### 5.3 대시보드 프로젝트 현황

| 항목 | 값 |
|------|---|
| Method | `GET` |
| URL | `/api/v1/dashboard/projects` |
| 권한 | ADMIN + TEAM_LEADER (USER는 접근 불가) |
| 성공 코드 | `200 OK` |

Response `data`:

```json
[
  {
    "projectId": 1,
    "title": "ERP 구축",
    "status": "PROGRESS",
    "progressRate": 40,
    "endDate": "2026-06-30"
  }
]
```

---

## 6. 화면별 API 호출 가이드

### 6.1 프로젝트 목록 페이지

```
GET /api/v1/projects
```

### 6.2 프로젝트 생성 모달

```
1. GET /api/v1/projects/leaders          → 팀장 드롭다운 목록
2. POST /api/v1/projects                 → 프로젝트 생성
```

### 6.3 프로젝트 수정 모달

```
PUT /api/v1/projects/{projectId}
```

### 6.4 프로젝트 팀장 변경

```
1. GET /api/v1/projects/leaders                → 팀장 후보 목록
2. PATCH /api/v1/projects/{projectId}/leader   → 팀장 변경
```

### 6.5 프로젝트 팀원 관리 모달

```
1. GET /api/v1/projects/{projectId}/members            → 현재 팀원 목록
2. GET /api/v1/projects/{projectId}/members/available   → 추가 가능 팀원
3. POST /api/v1/projects/{projectId}/members            → 팀원 추가
4. DELETE /api/v1/projects/{projectId}/members/{userId}  → 팀원 해제
```

### 6.6 사용자 프로젝트 권한 관리

```
1. GET /api/v1/projects/permissions/{userId}   → 현재 배정 상태 (체크박스용)
2. PUT /api/v1/projects/permissions/{userId}   → 선택한 프로젝트 저장
```

### 6.7 Task 목록 / 칸반보드

```
1. GET /api/v1/tasks                          → Task 목록
2. PATCH /api/v1/tasks/{taskId}/status        → 드래그 시 상태 변경
```

### 6.8 Task 생성 모달

```
1. GET /api/v1/projects/{projectId}/members/assignable  → 담당자 선택 목록
2. POST /api/v1/tasks                                    → Task 생성
```

### 6.9 Task 상세/수정

```
1. GET /api/v1/tasks/{taskId}                → 상세 조회
2. PUT /api/v1/tasks/{taskId}                → 수정
3. GET /api/v1/tasks/{taskId}/assignments    → 담당자 목록
4. POST /api/v1/tasks/{taskId}/assignments   → 담당자 추가
5. DELETE /api/v1/tasks/{taskId}/assignments/{userId}  → 담당자 해제
```

### 6.10 대시보드

```
1. GET /api/v1/dashboard/progress       → 진행률 차트 (전 역할)
2. GET /api/v1/dashboard/admin-summary  → 관리자 요약 카드 (ADMIN/TEAM_LEADER)
3. GET /api/v1/dashboard/projects       → 프로젝트 현황 목록 (ADMIN/TEAM_LEADER)
4. GET /api/v1/tasks/recent-assignments → 최근 배정 이력 (ADMIN/TEAM_LEADER)
```

---

## 7. 프론트 주의사항 체크리스트

- [ ] 모든 보호 API에 `Authorization: Bearer {token}` 헤더를 넣었는가
- [ ] Base URL 뒤에 `/api/v1`을 붙였는가
- [ ] 날짜 형식이 `"YYYY-MM-DD"`인가
- [ ] Enum 문자열이 대문자 값과 정확히 일치하는가 (`HIGH`, `TODO` 등)
- [ ] Task 상태 필드명을 `taskState`로 보내는가 (`taskStatus` 아님)
- [ ] `DELETE` 응답은 body 없이 `204`만 내려오는 것을 처리했는가
- [ ] 프로젝트 권한 저장 시 `assignedProjectIds` 배열로 전체를 한 번에 보내는가
- [ ] 에러 응답의 `success: false` + `error.code`로 에러 분기를 처리했는가
- [ ] 역할별 UI 분기를 처리했는가 (ADMIN/TEAM_LEADER/USER에 따라 보이는 메뉴/버튼이 다름)
- [ ] 중복 배정 시 `409` 에러를 사용자에게 안내하는가
