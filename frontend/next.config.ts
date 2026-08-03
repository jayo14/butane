import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/report-cards/generate",
        destination: "/dashboard/report-cards?tab=generate",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/archive",
        destination: "/dashboard/report-cards?tab=archive",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/approval",
        destination: "/dashboard/report-cards?tab=approval",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/customize",
        destination: "/dashboard/report-cards?tab=customize",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/remarks",
        destination: "/dashboard/report-cards?tab=remarks",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/mark-sheet",
        destination: "/dashboard/report-cards?tab=mark-sheet",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/review",
        destination: "/dashboard/report-cards?tab=review",
        permanent: false,
      },
      {
        source: "/dashboard/report-cards/broadsheet",
        destination: "/dashboard/report-cards?tab=broadsheet",
        permanent: false,
      },
      {
        source: "/dashboard/grading/setup-assessment",
        destination: "/dashboard/grading?tab=assessment-setup",
        permanent: false,
      },
      {
        source: "/dashboard/score-entry",
        destination: "/dashboard/grading?tab=score-entry",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
