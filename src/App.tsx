import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/Toast";
import { ModulesProvider } from "@/lib/modules";
import { WorkspaceProvider } from "@/lib/store";
import { AnalyticsProvider } from "@/lib/analytics-context";
import { DashboardShell } from "@/components/dashboard";
import { HomePage } from "@/pages/Home";
import {
  CampaignDetailPage,
  CampaignsPage,
  CreateCampaignPage,
} from "@/pages/Campaigns";
import {
  CreatePolstPage,
  PolstDetailPage,
  PolstsPage,
} from "@/pages/Polsts";
import { DistributionPage } from "@/pages/Distribution";
import { AudiencePage } from "@/pages/Audience";
import {
  AnalyticsAcquisitionPage,
  AnalyticsInsightsPage,
  AnalyticsOverviewPage,
  AnalyticsReportsPage,
  AnalyticsRetentionPage,
} from "@/pages/Analytics";
import { NotFoundPage, SettingsPage, TeamPage } from "@/pages/Settings";

export function App() {
  return (
    <ModulesProvider>
      <ToastProvider>
        <WorkspaceProvider>
        <AnalyticsProvider>
          <DashboardShell>
            <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/new" element={<CreateCampaignPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

            <Route path="/polsts" element={<PolstsPage />} />
            <Route path="/polsts/new" element={<CreatePolstPage />} />
            <Route path="/polsts/:id" element={<PolstDetailPage />} />

            <Route path="/distribution" element={<DistributionPage />} />
            <Route path="/audience" element={<AudiencePage />} />

            <Route path="/analytics" element={<AnalyticsOverviewPage />} />
            <Route path="/analytics/acquisition" element={<AnalyticsAcquisitionPage />} />
            <Route path="/analytics/retention" element={<AnalyticsRetentionPage />} />
            <Route path="/analytics/insights" element={<AnalyticsInsightsPage />} />
            <Route path="/analytics/reports" element={<AnalyticsReportsPage />} />

            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<TeamPage />} />

            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </DashboardShell>
        </AnalyticsProvider>
        </WorkspaceProvider>
      </ToastProvider>
    </ModulesProvider>
  );
}
