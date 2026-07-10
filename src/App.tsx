import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/lib/theme";
import { ModulesProvider } from "@/lib/modules";
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
import {
  ChannelDetailPage,
  CreatorDetailPage,
  DistributionPage,
} from "@/pages/Distribution";
import { AudiencePage } from "@/pages/Audience";
import {
  AnalyticsAcquisitionPage,
  AnalyticsInsightsPage,
  AnalyticsOverviewPage,
  AnalyticsReportsPage,
  AnalyticsRetentionPage,
} from "@/pages/Analytics";
import { NotFoundPage, SettingsPage } from "@/pages/Settings";

export function App() {
  return (
    <ThemeProvider>
      <ModulesProvider>
      <ToastProvider>
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
            <Route path="/distribution/channels/:id" element={<ChannelDetailPage />} />
            <Route path="/distribution/creators/:id" element={<CreatorDetailPage />} />
            <Route path="/audience" element={<AudiencePage />} />

            <Route path="/analytics" element={<AnalyticsOverviewPage />} />
            <Route path="/analytics/acquisition" element={<AnalyticsAcquisitionPage />} />
            <Route path="/analytics/retention" element={<AnalyticsRetentionPage />} />
            <Route path="/analytics/insights" element={<AnalyticsInsightsPage />} />
            <Route path="/analytics/reports" element={<AnalyticsReportsPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </DashboardShell>
      </ToastProvider>
      </ModulesProvider>
    </ThemeProvider>
  );
}
