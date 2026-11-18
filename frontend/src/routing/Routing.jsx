import { useApp } from '../context/AppContext'
import { Navigate, Route, Routes } from 'react-router'
import { Layout } from '../components/Layout/Layout'
import { LandingPage, AuthPage } from '../pages/PublicPages'
import { TodayPage } from '../pages/TodayPage'
import { HabitsPage, HabitDetailPage, HabitEditorPage } from '../pages/HabitPages'
import { OnboardingPage, CoachPage, PlanPage, HistoryPage } from '../pages/CoachPages'
import { ProgressPage, CalendarPage, GardenPage, AchievementsPage } from '../pages/ProgressPages'
import { ProfilePage, SettingsPage, RemindersPage } from '../pages/ProfilePages'
import { DataPage, InstallPage, OfflinePage, NotFoundPage } from '../pages/SystemPages'
import {
  AdminLayout,
  AdminOverviewPage,
  AdminUsersPage,
  AdminAiPage,
  AdminTemplatesPage,
  AdminTemplateEditorPage,
  AdminAuditPage,
} from '../pages/AdminPages'

export function Routing() {
  const { serverMode, authenticated, ready, online, loadError, data } = useApp()
  function privatePage(page, admin = false) {
    if (!serverMode) return page
    if (loadError || (!online && !authenticated)) return <OfflinePage />
    if (!ready) return <p role="status">Загрузка…</p>
    if (!authenticated) return <Navigate to="/login" replace />
    if (admin && data.profile.role !== 'admin') return <Navigate to="/profile" replace />
    return page
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="signup" element={<AuthPage signup />} />
        <Route path="install" element={<InstallPage />} />
        <Route path="data" element={<DataPage />} />
        <Route path="offline" element={<OfflinePage />} />
        <Route path="today" element={privatePage(<TodayPage />)} />
        <Route path="empty" element={privatePage(<TodayPage empty />)} />
        <Route path="rest" element={privatePage(<TodayPage rest />)} />
        <Route path="habits" element={privatePage(<HabitsPage />)} />
        <Route path="habits/new" element={privatePage(<HabitEditorPage key="new" />)} />
        <Route path="habits/:id" element={privatePage(<HabitDetailPage />)} />
        <Route path="habits/:id/edit" element={privatePage(<HabitEditorPage />)} />
        <Route path="onboarding" element={privatePage(<OnboardingPage />)} />
        <Route path="coach" element={privatePage(<CoachPage />)} />
        <Route path="coach-error" element={privatePage(<CoachPage error />)} />
        <Route path="plan" element={privatePage(<PlanPage />)} />
        <Route path="history" element={privatePage(<HistoryPage />)} />
        <Route path="progress" element={privatePage(<ProgressPage />)} />
        <Route path="calendar" element={privatePage(<CalendarPage />)} />
        <Route path="garden" element={privatePage(<GardenPage />)} />
        <Route path="achievements" element={privatePage(<AchievementsPage />)} />
        <Route path="profile" element={privatePage(<ProfilePage />)} />
        <Route path="settings" element={privatePage(<SettingsPage />)} />
        <Route path="reminders" element={privatePage(<RemindersPage />)} />
        <Route path="admin" element={privatePage(<AdminLayout />, true)}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="ai" element={<AdminAiPage />} />
          <Route path="templates" element={<AdminTemplatesPage />} />
          <Route path="templates/new" element={<AdminTemplateEditorPage key="new" />} />
          <Route path="templates/:id/edit" element={<AdminTemplateEditorPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>
        <Route path="404" element={<Navigate to="/not-found" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
