# Kuri Labo PRD

## 1. 项目概述

本项目是一个用于管理美甲客户、预约和作品图片的 CRM 系统。

项目名称：Kuri Labo

Kuri Labo 是一个 iOS-first 的美甲预约与客户管理 App，整体风格偏可爱、简洁、柔和，灵感来自日系和韩系美甲店应用。

系统分为两个端：

- User 端：给客户使用，用于注册登录、管理个人资料、查看自己的美甲记录、浏览美甲灵感图、预约时间。
- Admin 端：给美甲师/店主使用，用于管理用户、管理预约时间、上传用户美甲作品图片、管理灵感图库。

## 2. 项目目标

### 2.1 User 端目标

让用户可以：

- 注册和登录账号
- 管理自己的个人资料
- 查看自己曾经做过的美甲图片和日期
- 浏览美甲 inspiration 图片
- 查看可预约时间并完成预约

### 2.2 Admin 端目标

让管理员可以：

- 查看和管理用户信息
- 查看和管理预约
- 设置或管理 available slots
- 给指定用户上传美甲图片
- 上传和管理 inspiration 图片

## 3. 用户角色

### 3.1 User

普通客户账号。

主要权限：

- 查看和编辑自己的 profile
- 查看自己的 collection
- 浏览 inspiration
- 查看 available slots
- 创建预约
- 查看自己的预约记录

### 3.2 Admin

美甲师/店主账号。

主要权限：

- 管理所有用户
- 管理所有预约
- 管理时间表和 available slots
- 给用户上传 collection 图片
- 上传 public inspiration 图片

## 4. User 端功能

User 登录后，主界面有四个主要选项：

1. Profile
2. Collection
3. Inspiration
4. Book

---

## 4.1 Profile

### 功能说明

用户可以管理自己的资料。

### 字段建议

- Name
- Email
- Phone Number
- Birthday，可选
- Instagram，可选
- Notes，可选，可能只给 admin 看
- Preferred nail style，可选
- Allergy / special notes，可选

### User 可操作内容

- 查看自己的资料
- 编辑部分资料
- 修改密码，后续版本

---

## 4.2 Collection

### 功能说明

Collection 是用户在本店做过的所有美甲记录。

每条记录包含：

- 美甲图片
- 日期
- 可选描述
- 可选款式标签

### User 可操作内容

- 查看自己的所有美甲图片
- 按日期排序浏览
- 点击图片查看详情

### Admin 可操作内容

- 给某个用户上传图片
- 设置图片日期
- 添加描述或标签
- 删除或编辑图片记录

---

## 4.3 Inspiration

### 功能说明

Inspiration 是美甲灵感图库，用户可以浏览不同来源的美甲图片。

图片来源分为两类：

1. 其他用户的美甲图片
2. Admin 觉得好看并主动上传的图片

### 图片分类建议

- From Customers
- Uploaded by Admin

### 后续可扩展分类

- Simple
- Cute
- French
- Chrome
- Gel
- Wedding
- Seasonal
- Long nails
- Short nails

### User 可操作内容

- 浏览 inspiration 图片
- 点击查看大图
- 收藏图片，后续版本
- 用图片作为预约参考，后续版本

### Admin 可操作内容

- 上传 inspiration 图片
- 决定某个用户 collection 图片是否公开到 inspiration
- 添加标签
- 删除图片

---

## 4.4 Book

### 功能说明

用户可以通过 calendar 形式查看可预约时间，并选择一个 available time block 进行预约。

Book 页面应采用 iOS-first 的 calendar / schedule 体验，而不是普通表单列表。

### Calendar 规则

- 每一天的营业时间为 10:00 AM - 7:00 PM
- 用户必须可以选择更远的未来预约日期，不应只限制在接下来的 5 天；MVP UI 可以使用 week navigation 或 calendar picker 来浏览未来日期
- 每一天分成 3 个 time blocks
- 每个 time block 可以被预约一次
- 如果 time block 已被预约，显示为灰色 booked 状态
- 如果 time block 可预约，显示为 available 状态，用户可以点击预约
- 如果 admin 手动屏蔽某个时间段，显示为 blocked 状态

### 默认 Time Blocks

MVP 版本中，每一天默认分为：

1. 10:00 AM - 1:00 PM
2. 1:00 PM - 4:00 PM
3. 4:00 PM - 7:00 PM

### User 可操作内容

- 查看 calendar
- 切换日期
- 查看每天的 3 个 time blocks
- 点击 available time block
- 提交预约
- 查看预约状态

### Time Block 状态

- Available：可预约，使用可爱的 pastel 风格展示
- Booked：已被预约，显示灰色，不能点击
- Blocked：Admin 手动关闭，显示灰色或淡色 disabled 状态，不能点击

### 预约状态建议

- Pending：等待确认
- Confirmed：已确认
- Cancelled：已取消
- Completed：已完成

### MVP 预约流程

1. User 打开 Book 页面
2. 系统显示 calendar
3. User 选择某一天
4. 系统显示当天 3 个 time blocks
5. User 选择 available time block
6. User 提交预约
7. 系统创建 appointment，状态为 Pending
8. 被选择的 time block 显示为 Booked 或 Pending Reserved
9. Admin 可以在后台查看并确认预约

---

## 5. Admin 端功能

## 5.1 Dashboard

Admin 登录后可以看到：

- 今日预约
- 未来预约
- 最近新增用户
- 最近上传的美甲图片

---

## 5.2 User Management

### 功能说明

Admin 可以查看所有用户，并进入用户详情页。

### Admin 可操作内容

- 查看用户列表
- 搜索用户
- 查看用户 profile
- 查看用户 collection
- 给用户上传美甲图片
- 查看用户预约历史

---

## 5.3 Appointment Management

### 功能说明

Admin 可以管理所有预约时间。

### Admin 可操作内容

- 查看所有预约
- 按日期查看预约
- 确认预约
- 取消预约
- 标记预约完成
- 修改预约时间，后续版本

---

## 5.4 Availability / Slots Management

### 功能说明

Admin 可以设置哪些时间可以被用户预约。

### MVP 方案

Admin 手动创建 available slots。

每个 slot 包含：

- Date
- Start time
- End time
- Status

MVP 版本中，每一天默认有 3 个 slots：

1. 10:00 AM - 1:00 PM
2. 1:00 PM - 4:00 PM
3. 4:00 PM - 7:00 PM

Admin 可以查看每天的 slots，并将某个 slot 设置为 Available、Booked 或 Blocked。

### Slot 状态

- Available
- Booked
- Blocked

---

## 5.5 Image Upload Management

### 功能说明

Admin 可以上传两种图片：

1. 用户 collection 图片
2. public inspiration 图片

### 上传用户 collection 图片

Admin 需要选择：

- User
- Date
- Image
- Description，可选
- Tags，可选
- Whether show in inspiration，可选

### 上传 inspiration 图片

Admin 需要填写：

- Image
- Title，可选
- Tags，可选
- Source type: Admin Uploaded

---

## 6. 核心页面列表

## 6.1 User 端页面

- Login Page
- Register Page
- User Home / Dashboard
- Profile Page
- Collection Page
- Collection Detail Page
- Inspiration Page
- Book Page
- My Appointments Page，可选

## 6.2 Admin 端页面

- Admin Login Page
- Admin Dashboard
- User List Page
- User Detail Page
- Appointment List Page
- Calendar / Slots Page
- Upload User Collection Image Page
- Inspiration Management Page

---

## 7. 数据模型初稿

## 7.1 User

```ts
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  instagram?: string;
  role: 'user' | 'admin';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 7.2 NailCollectionItem

```ts
interface NailCollectionItem {
  id: string;
  userId: string;
  imageUrl: string;
  date: string;
  description?: string;
  tags?: string[];
  showInInspiration: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 7.3 InspirationImage

```ts
interface InspirationImage {
  id: string;
  imageUrl: string;
  sourceType: 'customer' | 'admin';
  userId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 7.4 Appointment

```ts
interface Appointment {
  id: string;
  userId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 7.5 AvailableSlot

```ts
interface AvailableSlot {
  id: string;
  date: string;
  startTime: string; // example: '10:00'
  endTime: string; // example: '13:00'
  status: 'available' | 'booked' | 'blocked';
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. MVP 范围

第一版建议只做最核心功能。

### MVP 必做

- User 注册 / 登录
- User Profile 页面
- User Collection 页面
- User Inspiration 页面
- User Book 页面
- Admin 登录
- Admin 查看用户列表
- Admin 上传用户 collection 图片
- Admin 创建 available slots
- Admin 查看和管理 appointments

### MVP 暂不做

- 在线支付
- 自动短信提醒
- 自动邮件提醒
- 图片 AI 分析
- 用户收藏 inspiration
- 复杂权限系统
- 多员工排班
- 多门店管理
- 用户评价系统

---

## 9. UI / Design 风格

### 整体风格

Kuri Labo 的 UI 风格应强调：

- cute aesthetic
- minimal UI
- soft / cozy feeling
- visual-first design
- Japanese / Korean nail salon inspired
- iOS-first mobile experience

避免：

- 企业后台风格
- 复杂拥挤布局
- 深色科技风
- 过重边框

### 主色调

- Pastel Pink: #ffc0cb
- Baby Blue: #89CFF0

### 辅助颜色

- White: #ffffff
- Soft Pink Background: #fff5f7
- Light Blue Background: #f0f9ff
- Soft Gray: #f5f5f5

### UI 要求

- 使用 rounded-xl 或 rounded-2xl
- 使用 soft shadow
- 大图优先
- inspiration 页面采用 Pinterest 风格图片布局
- 页面保持简洁留白
- 图片比文字更重要
- Mobile-first
- iOS-first

---

## 10. 推荐技术栈

### 前端 / Mobile App

- React Native
- Expo
- TypeScript
- Expo Router

### 后端 / 数据库

推荐使用 Supabase：

- Supabase Auth
- PostgreSQL
- Supabase Storage

优点：

- 注册登录简单
- 图片上传方便
- 非常适合 mobile app MVP
- SQL 数据结构清晰
- 后续扩展性好
- 很适合 vibe coding workflow

---

## 11. 第一阶段开发任务

## Phase 1: Project Setup

- 创建 Expo + React Native + TypeScript 项目
- 配置 Expo Router
- 配置基础 pastel pink / baby blue theme
- 创建移动端 navigation structure
- 创建 User / Admin mobile layout

## Phase 2: Auth

- 实现注册
- 实现登录
- 实现登出
- 根据 role 区分 user/admin

## Phase 3: User Pages

- Profile 页面
- Collection 页面
- Inspiration 页面
- Book 页面

## Phase 4: Admin Pages

- Admin Dashboard
- User List
- User Detail
- Upload Collection Image
- Slot Management
- Appointment Management

## Phase 5: Polish

- UI 美化
- Loading / Empty states
- Error handling
- iOS-first mobile polish

---

## 12. Codex 开发提示词初稿

```md
You are helping me build Kuri Labo, an iOS-first nail salon CRM and booking mobile app.

Important:
This project should be a React Native + Expo mobile app, not a Vite web app.

Tech stack:
- React Native
- Expo
- TypeScript
- Expo Router
- Supabase

The app has two roles:
- user
- admin

User side has four main sections:
1. Profile
2. Collection
3. Inspiration
4. Book

Admin side can:
- manage users
- manage appointments
- create available slots
- upload nail images for users
- upload inspiration images

UI requirements:
- cute aesthetic
- minimal design
- pastel pink #ffc0cb
- baby blue #89CFF0
- rounded cards
- soft shadows
- Japanese/Korean nail salon style
- iOS-first mobile experience

Please first create:
- Expo app structure
- navigation
- layouts
- placeholder screens
- reusable component structure
- theme setup

Do not implement backend logic yet.
Keep the code clean, modular, and easy to extend.
```

---

## 12. 已确定的 Booking MVP 规则

- Book 页面使用 calendar 形式
- 用户可以选择更远的未来日期，不只限于接下来的 5 天
- 每天营业时间为 10:00 AM - 7:00 PM
- 每天分成 3 个 time blocks
- 默认 time blocks 为 10:00 AM - 1:00 PM、1:00 PM - 4:00 PM、4:00 PM - 7:00 PM
- Available 可以预约
- Booked 显示灰色，不可点击
- Blocked 显示 disabled，不可点击
- User 提交预约后 appointment 默认为 Pending

---

## 13. 需要进一步确认的问题

这些问题不影响 MVP 开始，但后续需要确认：

1. User 预约后是否需要 Admin 手动确认？
2. User 是否可以取消预约？如果可以，提前多久可以取消？
3. Inspiration 里面其他用户图片是否默认匿名？
4. 用户 collection 图片是否默认 private？
5. 是否需要短信或邮件提醒？
6. Admin 是一个人还是未来可能有多个 staff？
7. 每个 appointment 的时长是固定的吗？例如 1 小时、1.5 小时、2 小时。
8. 是否需要服务类型？例如 Gel, Extension, Removal, Design。
9. 是否需要价格？
10. 是否需要在线支付或 deposit？
