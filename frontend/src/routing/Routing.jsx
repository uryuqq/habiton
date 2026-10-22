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
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="signup" element={<AuthPage signup />} />
        <Route path="install" element={<InstallPage />} />
        <Route path="data" element={<DataPage />} />
        <Route path="offline" element={<OfflinePage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="empty" element={<TodayPage empty />} />
        <Route path="rest" element={<TodayPage rest />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="habits/new" element={<HabitEditorPage key="new" />} />
        <Route path="habits/:id" element={<HabitDetailPage />} />
        <Route path="habits/:id/edit" element={<HabitEditorPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="coach" element={<CoachPage />} />
        <Route path="coach-error" element={<CoachPage error />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="garden" element={<GardenPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="admin" element={<AdminLayout />}>
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
